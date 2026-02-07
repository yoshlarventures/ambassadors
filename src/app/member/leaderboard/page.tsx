import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, History, Globe, MapPin, Building2 } from "lucide-react";
import { PlatformLeaderboard } from "./platform-leaderboard";
import { MemberPointsHistory } from "./member-points-history";

async function getUserInfo(userId: string) {
  const supabase = await createClient();

  // Get user's region
  const { data: user } = await supabase
    .from("users")
    .select("region_id, regions(id, name)")
    .eq("id", userId)
    .single();

  // Get user's club membership
  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id, clubs(id, name)")
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  return { user, membership };
}

async function getPlatformLeaderboard() {
  const supabase = await createClient();

  // Get all members (users with role 'member')
  const { data: members } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, region_id, regions(name)")
    .eq("role", "member");

  if (!members || members.length === 0) return [];

  // Get all points
  const memberIds = members.map(m => m.id);
  const { data: pointsData } = await supabase
    .from("points")
    .select("user_id, amount")
    .in("user_id", memberIds);

  // Aggregate points by user
  const pointsMap: Record<string, number> = {};
  pointsData?.forEach(p => {
    pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.amount;
  });

  type RegionInfo = { name: string } | null;
  const leaderboard = members
    .map(m => {
      const region = m.regions as unknown as RegionInfo;
      return {
        user_id: m.id,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        region_id: m.region_id,
        region_name: region?.name || null,
        total_points: pointsMap[m.id] || 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 100);

  return leaderboard;
}

async function getClubLeaderboard(clubId: string) {
  const supabase = await createClient();

  // Get approved club members with explicit foreign key reference
  const { data: members } = await supabase
    .from("club_members")
    .select("user_id, users:users!club_members_user_id_fkey(id, full_name, avatar_url, region_id, regions(name))")
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

  type UserInfo = { id: string; full_name: string; avatar_url: string | null; region_id: string | null; regions: { name: string } | null };
  const leaderboard = members
    .filter(m => m.users)
    .map(m => {
      const user = m.users as unknown as UserInfo;
      return {
        user_id: m.user_id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        region_id: user.region_id,
        region_name: user.regions?.name || null,
        total_points: pointsMap[m.user_id] || 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  return leaderboard;
}

async function getUserPoints(userId: string) {
  const supabase = await createClient();

  const { data: points } = await supabase
    .from("points")
    .select("id, amount, reason, reference_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return points || [];
}

async function getUserTotalPoints(userId: string) {
  const supabase = await createClient();

  const { data: points } = await supabase
    .from("points")
    .select("amount")
    .eq("user_id", userId);

  return points?.reduce((sum, p) => sum + p.amount, 0) || 0;
}

export default async function MemberLeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [userInfo, platformLeaderboard, userPoints, totalPoints] = await Promise.all([
    getUserInfo(user.id),
    getPlatformLeaderboard(),
    getUserPoints(user.id),
    getUserTotalPoints(user.id),
  ]);

  type RegionInfo = { id: string; name: string } | null;
  type ClubInfo = { id: string; name: string } | null;

  const userRegion = userInfo.user?.regions as unknown as RegionInfo;
  const userClubData = userInfo.membership?.clubs as unknown as ClubInfo | ClubInfo[];
  const userClub = Array.isArray(userClubData) ? userClubData[0] : userClubData;

  // Get club leaderboard if user has a club
  const clubLeaderboard = userClub ? await getClubLeaderboard(userClub.id) : [];

  // Find user's ranks
  const platformRank = platformLeaderboard.findIndex(l => l.user_id === user.id) + 1;

  // Regional leaderboard
  const regionalLeaderboard = userRegion
    ? platformLeaderboard.filter(l => l.region_id === userRegion.id)
    : [];
  const regionalRank = regionalLeaderboard.findIndex(l => l.user_id === user.id) + 1;

  // Club rank
  const clubRank = clubLeaderboard.findIndex(l => l.user_id === user.id) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Member rankings across the platform</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium">Your Rankings</span>
            <div className="flex flex-wrap items-center gap-4">
              {platformRank > 0 && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Platform:</span>
                  <Badge variant="secondary">#{platformRank}</Badge>
                </div>
              )}
              {regionalRank > 0 && userRegion && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userRegion.name}:</span>
                  <Badge variant="secondary">#{regionalRank}</Badge>
                </div>
              )}
              {clubRank > 0 && userClub && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Club:</span>
                  <Badge variant="secondary">#{clubRank}</Badge>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">{totalPoints} points</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platform" className="gap-2">
            <Globe className="h-4 w-4" />
            Platform
          </TabsTrigger>
          {userRegion && (
            <TabsTrigger value="regional" className="gap-2">
              <MapPin className="h-4 w-4" />
              {userRegion.name}
            </TabsTrigger>
          )}
          {userClub && (
            <TabsTrigger value="club" className="gap-2">
              <Building2 className="h-4 w-4" />
              {userClub.name}
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Points History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform">
          <PlatformLeaderboard
            entries={platformLeaderboard}
            currentUserId={user.id}
            title="Top 100 Members"
            showRegion={true}
          />
        </TabsContent>

        {userRegion && (
          <TabsContent value="regional">
            <PlatformLeaderboard
              entries={regionalLeaderboard}
              currentUserId={user.id}
              title={`${userRegion.name} Members`}
              showRegion={false}
            />
          </TabsContent>
        )}

        {userClub && (
          <TabsContent value="club">
            <PlatformLeaderboard
              entries={clubLeaderboard}
              currentUserId={user.id}
              title={`${userClub.name} Members`}
              showRegion={false}
            />
          </TabsContent>
        )}

        <TabsContent value="history">
          <MemberPointsHistory points={userPoints} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
