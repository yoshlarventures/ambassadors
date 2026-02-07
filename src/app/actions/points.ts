"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { POINTS } from "@/lib/gamification/points";

export async function awardAttendancePoints(
  memberIds: string[],
  sessionId: string,
  sessionTitle: string,
  sessionDate: string
) {
  // Use admin client to bypass RLS for points insertion
  const supabase = createAdminClient();

  // Format the date for display
  const formattedDate = new Date(sessionDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Insert points for each attending member
  const pointsRecords = memberIds.map(userId => ({
    user_id: userId,
    amount: POINTS.MEMBER_SESSION_ATTENDED,
    reason: `Attended "${sessionTitle}" on ${formattedDate}`,
    reference_type: "session",
    reference_id: sessionId,
  }));

  const { error } = await supabase.from("points").insert(pointsRecords);

  if (error) {
    console.error("Failed to award attendance points:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function awardManualPoints(
  memberId: string,
  amount: number,
  reason: string,
  clubId: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate amount
  if (amount < 1 || amount > 100) {
    return { success: false, error: "Amount must be between 1 and 100" };
  }

  // Verify user is an ambassador for this club
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("club_ambassadors")
    .select("id")
    .eq("club_id", clubId)
    .eq("ambassador_id", user.id)
    .single();

  if (!assignment && user.role !== "admin" && user.role !== "regional_leader") {
    return { success: false, error: "Not authorized to give points to this club's members" };
  }

  // Verify member belongs to this club
  const { data: membership } = await supabase
    .from("club_members")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", memberId)
    .eq("status", "approved")
    .single();

  if (!membership) {
    return { success: false, error: "Member not found in this club" };
  }

  // Use admin client to bypass RLS for points insertion
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("points").insert({
    user_id: memberId,
    amount,
    reason,
    reference_type: "manual",
    reference_id: clubId,
  });

  if (error) {
    console.error("Failed to award manual points:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Admin action to retroactively award points for past attendance
export async function awardRetroactiveAttendancePoints() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Admin access required" };
  }

  const adminClient = createAdminClient();

  // Get all attendance records where member was present, including session details
  const { data: attendanceRecords, error: fetchError } = await adminClient
    .from("session_attendance")
    .select("session_id, member_id, sessions(title, session_date)")
    .eq("attended", true);

  if (fetchError) {
    console.error("Failed to fetch attendance records:", fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return { success: true, message: "No attendance records found", awarded: 0 };
  }

  // Get existing points for session attendance to avoid duplicates
  const { data: existingPoints } = await adminClient
    .from("points")
    .select("user_id, reference_id")
    .eq("reference_type", "session");

  // Create a set of existing user_id + session_id combinations
  const existingSet = new Set(
    (existingPoints || []).map(p => `${p.user_id}-${p.reference_id}`)
  );

  // Filter out attendance records that already have points
  const newRecords = attendanceRecords.filter(
    a => !existingSet.has(`${a.member_id}-${a.session_id}`)
  );

  if (newRecords.length === 0) {
    return { success: true, message: "All attendance already has points", awarded: 0 };
  }

  // Create points records with session details
  type SessionInfo = { title: string; session_date: string };
  const pointsRecords = newRecords.map(a => {
    const session = a.sessions as unknown as SessionInfo | null;
    const sessionTitle = session?.title || "Club Session";
    const sessionDate = session?.session_date
      ? new Date(session.session_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

    return {
      user_id: a.member_id,
      amount: POINTS.MEMBER_SESSION_ATTENDED,
      reason: sessionDate
        ? `Attended "${sessionTitle}" on ${sessionDate}`
        : `Attended "${sessionTitle}"`,
      reference_type: "session",
      reference_id: a.session_id,
    };
  });

  const { error: insertError } = await adminClient.from("points").insert(pointsRecords);

  if (insertError) {
    console.error("Failed to insert retroactive points:", insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, message: `Awarded points for ${newRecords.length} attendance records`, awarded: newRecords.length };
}
