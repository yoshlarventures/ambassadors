import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, GraduationCap, History, Users, UserCircle } from "lucide-react";
import { PointsHistory } from "@/components/leaderboard/points-history";
import { LeadClickableLeaderboard } from "@/app/lead/leaderboard/lead-clickable-leaderboard";
import type { LeaderboardEntry, FilterOption } from "@/app/lead/leaderboard/lead-clickable-leaderboard";

interface PointEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

async function getAllAmbassadors(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exode_course_points, region_id, regions(name)")
    .eq("role", "ambassador");

  const { data: points } = await supabase.from("points").select("user_id, amount");

  if (!users) return [];

  const pointsMap: Record<string, number> = {};
  points?.forEach((p) => {
    pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.amount;
  });

  return users
    .map((user) => {
      const region = user.regions as { name: string } | null;
      return {
        user_id: user.id,
        total_points: pointsMap[user.id] || 0,
        exode_course_points: user.exode_course_points || 0,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        region_id: user.region_id,
        region_name: region?.name || null,
      };
    })
    .sort(
      (a, b) =>
        b.total_points + b.exode_course_points - (a.total_points + a.exode_course_points)
    );
}

async function getAllMembers(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Get all members
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, region_id, regions(name)")
    .eq("role", "member");

  if (!users) return [];

  const memberIds = users.map((u) => u.id);

  // Get club memberships
  const { data: memberships } = await supabase
    .from("club_members")
    .select("user_id, club_id, clubs(name)")
    .in("user_id", memberIds)
    .eq("status", "approved");

  type ClubInfo = { name: string };
  const membershipMap: Record<string, { club_id: string; club_name: string }> = {};
  memberships?.forEach((m) => {
    const club = m.clubs as unknown as ClubInfo | null;
    if (club) {
      membershipMap[m.user_id] = { club_id: m.club_id, club_name: club.name };
    }
  });

  // Get all points
  const { data: points } = await supabase.from("points").select("user_id, amount");
  const pointsMap: Record<string, number> = {};
  points?.forEach((p) => {
    pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.amount;
  });

  return users
    .map((user) => {
      const region = user.regions as { name: string } | null;
      const membership = membershipMap[user.id];
      return {
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        region_id: user.region_id,
        region_name: region?.name || null,
        club_id: membership?.club_id || null,
        club_name: membership?.club_name || null,
        total_points: pointsMap[user.id] || 0,
        exode_course_points: 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);
}

async function getAmbassadorClubIds(ambassadorId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("club_ambassadors")
    .select("club_id")
    .eq("ambassador_id", ambassadorId);

  return data?.map((d) => d.club_id) || [];
}

async function getAmbassadorClubs(
  ambassadorId: string
): Promise<FilterOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("club_ambassadors")
    .select("club_id, clubs(id, name)")
    .eq("ambassador_id", ambassadorId);

  if (!data) return [];

  type ClubInfo = { id: string; name: string };
  return data
    .filter((d) => d.clubs)
    .map((d) => {
      const club = d.clubs as unknown as ClubInfo;
      return { value: club.id, label: club.name };
    });
}

async function getUserPoints(userId: string) {
  const supabase = await createClient();

  const { data: points } = await supabase
    .from("points")
    .select("id, amount, reason, reference_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: userData } = await supabase
    .from("users")
    .select("exode_course_points, exode_points_synced_at")
    .eq("id", userId)
    .single();

  return {
    points: points || [],
    exodeCoursePoints: userData?.exode_course_points || 0,
    exodePointsSyncedAt: userData?.exode_points_synced_at || null,
  };
}

async function getAllPointsForUsers(
  userIds: string[]
): Promise<Record<string, PointEntry[]>> {
  if (userIds.length === 0) return {};

  const supabase = await createClient();
  const { data: points } = await supabase
    .from("points")
    .select("id, user_id, amount, reason, reference_type, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  const pointsByUser: Record<string, PointEntry[]> = {};
  points?.forEach((point) => {
    if (!pointsByUser[point.user_id]) {
      pointsByUser[point.user_id] = [];
    }
    pointsByUser[point.user_id].push(point);
  });

  return pointsByUser;
}

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get user's region info
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("region_id, regions(name)")
    .eq("id", user.id)
    .single();

  const regionId = profile?.region_id || null;
  const regionName =
    (profile?.regions as { name: string } | null)?.name || "My Region";

  const [
    allAmbassadors,
    allMembers,
    ambassadorClubOptions,
    ambassadorClubIds,
    userPoints,
  ] = await Promise.all([
    getAllAmbassadors(),
    getAllMembers(),
    getAmbassadorClubs(user.id),
    getAmbassadorClubIds(user.id),
    getUserPoints(user.id),
  ]);

  // Ambassadors tab: NOT clickable (peers)
  // Members tab: clickable only for members in ambassador's clubs
  const clubMemberIds = allMembers
    .filter((m) => m.club_id && ambassadorClubIds.includes(m.club_id))
    .map((m) => m.user_id);

  // Fetch point history only for club members (subordinates)
  const pointsByUser = await getAllPointsForUsers(clubMemberIds);

  // Current user rank among ambassadors
  const currentUserRank =
    allAmbassadors.findIndex((l) => l.user_id === user.id) + 1;
  const currentUserEntry =
    currentUserRank > 0 ? allAmbassadors[currentUserRank - 1] : null;

  // Build member scope filter options: My Region + each of ambassador's clubs
  const memberScopeOptions: FilterOption[] = [];
  if (regionId) {
    memberScopeOptions.push({ value: regionId, label: regionName });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Rankings and points history</p>
      </div>

      {currentUserRank > 0 && currentUserEntry && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Rank</span>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">#{currentUserRank}</Badge>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">
                      {currentUserEntry.total_points}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span className="font-bold">
                      {currentUserEntry.exode_course_points}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ambassadors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ambassadors" className="gap-2">
            <Users className="h-4 w-4" />
            Ambassadors ({allAmbassadors.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UserCircle className="h-4 w-4" />
            Members ({allMembers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Points History
          </TabsTrigger>
        </TabsList>

        {/* Ambassadors tab - NOT clickable (peers) with All/My Region filter */}
        <TabsContent value="ambassadors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ambassadors Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadClickableLeaderboard
                entries={allAmbassadors}
                pointsByUser={{}}
                clickableUserIds={[]}
                currentUserId={user.id}
                showExodeCourse={true}
                showSubtext="region"
                scopeFilter={
                  regionId
                    ? {
                        label: "View",
                        field: "region_id",
                        options: [{ value: regionId, label: regionName }],
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members tab - clickable only for own club members */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Members Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadClickableLeaderboard
                entries={allMembers}
                pointsByUser={pointsByUser}
                clickableUserIds={clubMemberIds}
                showExodeCourse={false}
                showSubtext="club_and_region"
                scopeFilter={
                  regionId
                    ? {
                        label: "View",
                        field: "region_id",
                        options: [{ value: regionId, label: regionName }],
                      }
                    : undefined
                }
                clubFilter={
                  ambassadorClubOptions.length > 0
                    ? { options: ambassadorClubOptions }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {userPoints ? (
            <PointsHistory
              points={userPoints.points}
              exodeCoursePoints={userPoints.exodeCoursePoints}
              exodePointsSyncedAt={userPoints.exodePointsSyncedAt}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Sign in to view your points history.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
