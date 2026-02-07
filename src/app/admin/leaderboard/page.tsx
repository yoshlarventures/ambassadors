import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Users, UserCircle } from "lucide-react";
import { AdminLeaderboardTable } from "./admin-leaderboard-table";
import { AdminMemberLeaderboard } from "./admin-member-leaderboard";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  exode_course_points: number;
  full_name: string;
  avatar_url: string | null;
  region_id: string | null;
  region_name: string | null;
}

interface Region {
  id: string;
  name: string;
}

interface Club {
  id: string;
  name: string;
  region_id: string | null;
}

interface MemberEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  region_id: string | null;
  region_name: string | null;
  club_id: string | null;
  club_name: string | null;
  total_points: number;
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

  const leaderboard: LeaderboardEntry[] = users.map((user) => {
    const region = user.regions as unknown as { name: string } | null;
    return {
      user_id: user.id,
      total_points: pointsMap[user.id] || 0,
      exode_course_points: user.exode_course_points || 0,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      region_id: user.region_id,
      region_name: region?.name || null,
    };
  });

  return leaderboard.sort(
    (a, b) => (b.total_points + b.exode_course_points) - (a.total_points + a.exode_course_points)
  );
}

async function getAmbassadorsLeaderboard(): Promise<LeaderboardEntry[]> {
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

  const leaderboard: LeaderboardEntry[] = users.map((user) => {
    const region = user.regions as unknown as { name: string } | null;
    return {
      user_id: user.id,
      total_points: pointsMap[user.id] || 0,
      exode_course_points: user.exode_course_points || 0,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      region_id: user.region_id,
      region_name: region?.name || null,
    };
  });

  return leaderboard.sort(
    (a, b) => (b.total_points + b.exode_course_points) - (a.total_points + a.exode_course_points)
  );
}

async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("regions").select("id, name").order("name");
  return data || [];
}

async function getClubs(): Promise<Club[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clubs").select("id, name, region_id").order("name");
  return data || [];
}

async function getMembersLeaderboard(): Promise<MemberEntry[]> {
  const supabase = await createClient();

  // Get all members with their club memberships
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, region_id, regions(name)")
    .eq("role", "member");

  if (!users) return [];

  // Get club memberships for all members
  const memberIds = users.map(u => u.id);
  const { data: memberships } = await supabase
    .from("club_members")
    .select("user_id, club_id, clubs(id, name)")
    .in("user_id", memberIds)
    .eq("status", "approved");

  // Create membership map
  type ClubInfo = { id: string; name: string };
  const membershipMap: Record<string, { club_id: string; club_name: string }> = {};
  memberships?.forEach(m => {
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

  const leaderboard: MemberEntry[] = users.map((user) => {
    const region = user.regions as unknown as { name: string } | null;
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
    };
  });

  return leaderboard.sort((a, b) => b.total_points - a.total_points);
}

async function getAllUserPoints() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("points")
    .select("id, user_id, amount, reason, reference_type, created_at")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminLeaderboardPage() {
  const [leadsLeaderboard, ambassadorsLeaderboard, membersLeaderboard, regions, clubs, allPoints] = await Promise.all([
    getLeadsLeaderboard(),
    getAmbassadorsLeaderboard(),
    getMembersLeaderboard(),
    getRegions(),
    getClubs(),
    getAllUserPoints(),
  ]);

  // Group points by user
  const pointsByUser: Record<string, typeof allPoints> = {};
  allPoints.forEach((point) => {
    if (!pointsByUser[point.user_id]) {
      pointsByUser[point.user_id] = [];
    }
    pointsByUser[point.user_id].push(point);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">View all user rankings and point history</p>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <Crown className="h-4 w-4" />
            Regional Leaders ({leadsLeaderboard.length})
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-2">
            <Users className="h-4 w-4" />
            Ambassadors ({ambassadorsLeaderboard.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UserCircle className="h-4 w-4" />
            Members ({membersLeaderboard.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Regional Leaders Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLeaderboardTable
                entries={leadsLeaderboard}
                pointsByUser={pointsByUser}
                showRegion={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambassadors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ambassadors Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLeaderboardTable
                entries={ambassadorsLeaderboard}
                pointsByUser={pointsByUser}
                regions={regions}
                showRegion={true}
                showFilter={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Members Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminMemberLeaderboard
                entries={membersLeaderboard}
                pointsByUser={pointsByUser}
                regions={regions}
                clubs={clubs}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
