import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubSwitcher } from "../club-switcher";
import { GivePointsForm } from "./give-points-form";
import { PointsHistory } from "./points-history";

type ClubData = {
  id: string;
  name: string;
};

async function getAmbassadorClubs(ambassadorId: string) {
  const supabase = await createClient();

  const { data: clubAssignments } = await supabase
    .from("club_ambassadors")
    .select("club_id, club:clubs(id, name)")
    .eq("ambassador_id", ambassadorId);

  return clubAssignments || [];
}

async function getClubMembers(clubId: string) {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("club_members")
    .select("user_id, users!club_members_user_id_fkey(id, full_name, email)")
    .eq("club_id", clubId)
    .eq("status", "approved");

  return members || [];
}

async function getRecentPointsAwarded(clubId: string) {
  const supabase = await createClient();

  // Get points awarded to club members (manual type, with club as reference_id)
  const { data: points } = await supabase
    .from("points")
    .select("id, user_id, amount, reason, created_at, users(full_name)")
    .eq("reference_type", "manual")
    .eq("reference_id", clubId)
    .order("created_at", { ascending: false })
    .limit(10);

  return points || [];
}

interface PageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function GivePointsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const clubAssignments = await getAmbassadorClubs(user.id);

  if (clubAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Give Points</h1>
          <p className="text-muted-foreground">Reward your club members</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You are not assigned to any club yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const allClubs = clubAssignments
    .map(a => a.club as unknown as ClubData | null)
    .filter((c): c is ClubData => c !== null);

  const selectedClubId = params.clubId;
  let selectedAssignment = selectedClubId
    ? clubAssignments.find(a => a.club_id === selectedClubId)
    : clubAssignments[0];

  if (!selectedAssignment) {
    selectedAssignment = clubAssignments[0];
  }

  const club = selectedAssignment.club as unknown as ClubData | null;

  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Give Points</h1>
          <p className="text-muted-foreground">Reward your club members</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Club data not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [members, recentPoints] = await Promise.all([
    getClubMembers(club.id),
    getRecentPointsAwarded(club.id),
  ]);

  type MemberInfo = { id: string; full_name: string; email: string };
  const memberList = members
    .filter(m => m.users)
    .map(m => {
      const userInfo = m.users as unknown as MemberInfo;
      return {
        id: m.user_id,
        full_name: userInfo.full_name,
        email: userInfo.email,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Give Points</h1>
          <p className="text-muted-foreground">Reward members of {club.name}</p>
        </div>
        {allClubs.length > 1 && (
          <ClubSwitcher
            clubs={allClubs.map(c => ({ id: c.id, name: c.name }))}
            currentClubId={club.id}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Award Points</CardTitle>
          </CardHeader>
          <CardContent>
            <GivePointsForm members={memberList} clubId={club.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <PointsHistory points={recentPoints} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
