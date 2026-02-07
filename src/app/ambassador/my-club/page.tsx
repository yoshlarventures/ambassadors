import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { ClubProfile } from "./club-profile";
import { ClubSwitcher } from "./club-switcher";
import { ClubLeaderboardCard } from "./club-leaderboard-card";
import { Card, CardContent } from "@/components/ui/card";

async function getAmbassadorClubs(ambassadorId: string) {
  const supabase = await createClient();

  // Get clubs where this user is an ambassador
  const { data: clubAssignments } = await supabase
    .from("club_ambassadors")
    .select(`
      club_id,
      club:clubs(*, regions(name, name_uz))
    `)
    .eq("ambassador_id", ambassadorId);

  return clubAssignments || [];
}

async function getRegions() {
  const supabase = await createClient();
  const { data: regions } = await supabase.from("regions").select("*").order("name");
  return regions || [];
}

async function getPendingMemberCount(clubId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("status", "pending");
  return count || 0;
}

async function getClubAmbassadors(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_ambassadors")
    .select("ambassador:users!club_ambassadors_ambassador_id_fkey(id, full_name, email, avatar_url)")
    .eq("club_id", clubId);
  return (data || [])
    .map(d => d.ambassador as unknown as { id: string; full_name: string; email: string; avatar_url: string | null } | null)
    .filter((a): a is { id: string; full_name: string; email: string; avatar_url: string | null } => a !== null);
}

async function getClubAttendanceRate(clubId: string) {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("attendance_rate")
    .eq("club_id", clubId)
    .eq("is_confirmed", true)
    .not("attendance_rate", "is", null);

  if (!sessions || sessions.length === 0) return null;

  const totalRate = sessions.reduce((sum, s) => sum + (s.attendance_rate || 0), 0);
  return Math.round(totalRate / sessions.length);
}

async function getClubMemberLeaderboard(clubId: string) {
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
    .slice(0, 10);

  return leaderboard;
}

type ClubData = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  region_id: string;
  address: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  regions: { name: string; name_uz: string } | null;
};

interface PageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function MyClubPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [clubAssignments, regions] = await Promise.all([
    getAmbassadorClubs(user.id),
    getRegions(),
  ]);

  if (clubAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Club</h1>
          <p className="text-muted-foreground">Manage your startup club</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You are not assigned to any club yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your Regional Leader or Admin to be assigned to a club.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all clubs for the switcher
  const allClubs = clubAssignments
    .map(a => a.club as unknown as ClubData | null)
    .filter((c): c is ClubData => c !== null);

  // Find the selected club (from URL param) or default to first
  const selectedClubId = params.clubId;
  let selectedAssignment = selectedClubId
    ? clubAssignments.find(a => a.club_id === selectedClubId)
    : clubAssignments[0];

  // If invalid clubId provided, fall back to first
  if (!selectedAssignment) {
    selectedAssignment = clubAssignments[0];
  }

  const club = selectedAssignment.club as unknown as ClubData | null;

  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Club</h1>
          <p className="text-muted-foreground">Manage your startup club</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Club data not found. Please contact support.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [pendingMemberCount, ambassadors, attendanceRate, leaderboard] = await Promise.all([
    getPendingMemberCount(club.id),
    getClubAmbassadors(club.id),
    getClubAttendanceRate(club.id),
    getClubMemberLeaderboard(club.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Club</h1>
          <p className="text-muted-foreground">Manage your startup club</p>
        </div>
        {allClubs.length > 1 && (
          <ClubSwitcher
            clubs={allClubs.map(c => ({ id: c.id, name: c.name }))}
            currentClubId={club.id}
          />
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ClubProfile club={club} regions={regions} pendingMemberCount={pendingMemberCount} ambassadors={ambassadors} attendanceRate={attendanceRate} />
        <ClubLeaderboardCard leaderboard={leaderboard} />
      </div>
    </div>
  );
}
