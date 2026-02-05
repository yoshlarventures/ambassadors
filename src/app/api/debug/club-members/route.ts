import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";

// Debug endpoint - remove in production
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get ambassador's club assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from("club_ambassadors")
    .select("club_id, club:clubs(id, name)")
    .eq("ambassador_id", user.id);

  // Get all pending members across all clubs (for debugging)
  // Use explicit foreign key hint for the user relationship
  const { data: allPending, error: pendingError } = await supabase
    .from("club_members")
    .select("*, club:clubs(id, name), user:users!club_members_user_id_fkey(id, full_name, email)")
    .eq("status", "pending");

  // Get members for ambassador's clubs
  let clubMembers = null;
  if (assignment && assignment.length > 0) {
    const clubIds = assignment.map(a => a.club_id);
    const { data: members, error: membersError } = await supabase
      .from("club_members")
      .select("*, club:clubs(id, name), user:users!club_members_user_id_fkey(id, full_name, email)")
      .in("club_id", clubIds);

    clubMembers = { members, error: membersError?.message };
  }

  return NextResponse.json({
    currentUser: { id: user.id, role: user.role, email: user.email },
    ambassadorAssignments: { data: assignment, error: assignmentError?.message },
    allPendingMembers: { data: allPending, error: pendingError?.message },
    ambassadorClubMembers: clubMembers,
  });
}
