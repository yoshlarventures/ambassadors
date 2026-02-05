import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { ClubProfile } from "./club-profile";
import { ClubSwitcher } from "./club-switcher";
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

  const [pendingMemberCount, ambassadors, attendanceRate] = await Promise.all([
    getPendingMemberCount(club.id),
    getClubAmbassadors(club.id),
    getClubAttendanceRate(club.id),
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
      <ClubProfile club={club} regions={regions} pendingMemberCount={pendingMemberCount} ambassadors={ambassadors} attendanceRate={attendanceRate} />
    </div>
  );
}
