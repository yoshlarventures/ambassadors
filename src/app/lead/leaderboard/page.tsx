import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, GraduationCap, History, Users, Crown, UserCircle } from "lucide-react";
import { PointsHistory } from "@/components/leaderboard/points-history";
import { LeadClickableLeaderboard } from "./lead-clickable-leaderboard";
import type { LeaderboardEntry, FilterOption } from "./lead-clickable-leaderboard";

interface PointEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, region_id, full_name, exode_course_points, exode_points_synced_at, regions(name)")
    .eq("id", user.id)
    .single();

  return profile;
}

async function getLeadsLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exode_course_points, region_id, regions(name)")
    .eq("role", "regional_leader");

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

async function getRegionClubs(
  regionId: string
): Promise<FilterOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("region_id", regionId)
    .order("name");

  return (data || []).map((c) => ({ value: c.id, label: c.name }));
}

export default async function LeadLeaderboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader") {
    redirect("/");
  }

  const regionName = (user.regions as { name: string } | null)?.name || "My Region";

  const [leadsLeaderboard, allAmbassadors, allMembers, clubFilterOptions, userPoints] =
    await Promise.all([
      getLeadsLeaderboard(),
      getAllAmbassadors(),
      getAllMembers(),
      user.region_id ? getRegionClubs(user.region_id) : Promise.resolve([]),
      getUserPoints(user.id),
    ]);

  // Clickable: only ambassadors in lead's region
  const regionAmbassadorIds = allAmbassadors
    .filter((a) => a.region_id === user.region_id)
    .map((a) => a.user_id);

  // Clickable: only members in lead's region
  const regionMemberIds = allMembers
    .filter((m) => m.region_id === user.region_id)
    .map((m) => m.user_id);

  // Fetch point history only for subordinates (region ambassadors + region members)
  const subordinateIds = [...regionAmbassadorIds, ...regionMemberIds];
  const pointsByUser = await getAllPointsForUsers(subordinateIds);

  // Current user rank among leads
  const currentUserRank =
    leadsLeaderboard.findIndex((l) => l.user_id === user.id) + 1;
  const currentUserEntry =
    currentUserRank > 0 ? leadsLeaderboard[currentUserRank - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Rankings and points history</p>
      </div>

      {currentUserEntry && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Rank (Among Leads)</span>
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

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <Crown className="h-4 w-4" />
            Leads
          </TabsTrigger>
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

        {/* Leads tab - NOT clickable (no point history of peers) */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Regional Leaders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadClickableLeaderboard
                entries={leadsLeaderboard}
                pointsByUser={{}}
                clickableUserIds={[]}
                currentUserId={user.id}
                showExodeCourse={true}
                showSubtext="region"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambassadors tab - clickable only for own region ambassadors */}
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
                pointsByUser={pointsByUser}
                clickableUserIds={regionAmbassadorIds}
                showExodeCourse={true}
                showSubtext="region"
                scopeFilter={{
                  label: "View",
                  field: "region_id",
                  options: user.region_id
                    ? [{ value: user.region_id, label: regionName }]
                    : [],
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members tab - clickable only for region members */}
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
                clickableUserIds={regionMemberIds}
                showExodeCourse={false}
                showSubtext="club_and_region"
                scopeFilter={
                  user.region_id
                    ? {
                        label: "View",
                        field: "region_id",
                        options: [{ value: user.region_id, label: regionName }],
                      }
                    : undefined
                }
                clubFilter={
                  clubFilterOptions.length > 0
                    ? { options: clubFilterOptions }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <PointsHistory
            points={userPoints.points}
            exodeCoursePoints={userPoints.exodeCoursePoints}
            exodePointsSyncedAt={userPoints.exodePointsSyncedAt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
