import { createClient } from "@/lib/supabase/server";

export const POINTS = {
  MEMBER_APPROVED: 2,
  SESSION_CONFIRMED: 33,
  EVENT_COMPLETED: 100,
  SESSION_ATTENDED: 10, // For member leaderboard
  MEMBER_SESSION_ATTENDED: 30, // For members attending sessions
} as const;

export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("points").insert({
    user_id: userId,
    amount,
    reason,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });

  if (error) {
    console.error("Failed to award points:", error);
    return false;
  }

  return true;
}

export async function getUserTotalPoints(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("points")
    .select("amount")
    .eq("user_id", userId);

  return data?.reduce((sum, p) => sum + p.amount, 0) || 0;
}

export async function getLeaderboard(regionId?: string, limit: number = 20) {
  const supabase = await createClient();

  // Using a raw query to aggregate points
  const { data } = await supabase
    .from("points")
    .select("user_id, users(full_name, avatar_url, region_id, regions(name))");

  if (!data) return [];

  // Aggregate points by user
  const userPoints: Record<string, {
    user_id: string;
    total_points: number;
    full_name: string;
    avatar_url: string | null;
    region_id: string | null;
    region_name: string | null;
  }> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((point: any) => {
    if (!point.users) return;

    // Filter by region if specified
    if (regionId && point.users.region_id !== regionId) return;

    if (!userPoints[point.user_id]) {
      userPoints[point.user_id] = {
        user_id: point.user_id,
        total_points: 0,
        full_name: point.users.full_name,
        avatar_url: point.users.avatar_url,
        region_id: point.users.region_id,
        region_name: point.users.regions?.name || null,
      };
    }
  });

  // Need to get amounts separately since we can't select amount with the join
  const { data: pointsData } = await supabase
    .from("points")
    .select("user_id, amount");

  pointsData?.forEach(p => {
    if (userPoints[p.user_id]) {
      userPoints[p.user_id].total_points += p.amount;
    }
  });

  // Sort by points and limit
  return Object.values(userPoints)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);
}

export async function getClubMemberLeaderboard(clubId: string, limit: number = 50) {
  const supabase = await createClient();

  // Get approved club members
  const { data: members } = await supabase
    .from("club_members")
    .select("user_id, users(id, full_name, avatar_url)")
    .eq("club_id", clubId)
    .eq("status", "approved");

  if (!members || members.length === 0) return [];

  // Get all points for these members
  const memberIds = members.map(m => m.user_id);
  const { data: pointsData } = await supabase
    .from("points")
    .select("user_id, amount")
    .in("user_id", memberIds);

  // Aggregate points by user
  const pointsMap: Record<string, number> = {};
  pointsData?.forEach(p => {
    pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.amount;
  });

  // Build leaderboard
  type UserInfo = { id: string; full_name: string; avatar_url: string | null };
  const leaderboard = members
    .filter(m => m.users)
    .map(m => {
      const user = m.users as unknown as UserInfo;
      return {
        user_id: m.user_id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        total_points: pointsMap[m.user_id] || 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);

  return leaderboard;
}
