import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionsList } from "./sessions-list";
import { CreateSessionDialog } from "./create-session-dialog";
import { ClubSwitcher } from "../club-switcher";

async function getAmbassadorClubs(ambassadorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_ambassadors")
    .select("club_id, clubs(id, name)")
    .eq("ambassador_id", ambassadorId);
  return data || [];
}

async function getClubSessions(clubId: string) {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("club_id", clubId)
    .order("session_date", { ascending: false });
  return sessions || [];
}

interface PageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const clubs = await getAmbassadorClubs(user.id);

  if (clubs.length === 0) {
    redirect("/ambassador/my-club");
  }

  // Use clubId from URL or default to first club
  const clubId = params.clubId && clubs.some(c => c.club_id === params.clubId)
    ? params.clubId
    : clubs[0].club_id;

  const sessions = await getClubSessions(clubId);

  const now = new Date();
  // Use local date, not UTC (toISOString gives UTC)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Session needs confirmation if:
  // 1. Date is in the past, OR
  // 2. Date is today AND start_time has passed
  const isSessionPast = (session: typeof sessions[0]) => {
    if (session.session_date < today) return true;
    if (session.session_date === today && session.start_time.slice(0, 5) <= currentTime) return true;
    return false;
  };

  // Sort helper: combines date and time for comparison
  const sortByDateTime = (a: typeof sessions[0], b: typeof sessions[0], ascending = true) => {
    const dateTimeA = `${a.session_date}T${a.start_time}`;
    const dateTimeB = `${b.session_date}T${b.start_time}`;
    return ascending
      ? dateTimeA.localeCompare(dateTimeB)
      : dateTimeB.localeCompare(dateTimeA);
  };

  // Upcoming: soonest first (ascending)
  const upcomingSessions = sessions
    .filter(s => !isSessionPast(s))
    .sort((a, b) => sortByDateTime(a, b, true));

  // Past confirmed: most recent first (descending)
  const pastConfirmed = sessions
    .filter(s => isSessionPast(s) && s.is_confirmed)
    .sort((a, b) => sortByDateTime(a, b, false));

  // Needs confirmation: oldest first (ascending) - to confirm oldest sessions first
  const needsConfirmation = sessions
    .filter(s => isSessionPast(s) && !s.is_confirmed)
    .sort((a, b) => sortByDateTime(a, b, true));

  // Extract club options for the switcher
  const allClubs = clubs
    .map(c => c.clubs as unknown as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => c !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Manage your club sessions</p>
        </div>
        <div className="flex items-center gap-4">
          {allClubs.length > 1 && (
            <ClubSwitcher clubs={allClubs} currentClubId={clubId} />
          )}
          <CreateSessionDialog clubId={clubId} />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="needs-confirmation">
            Needs Confirmation ({needsConfirmation.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastConfirmed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList sessions={upcomingSessions} clubId={clubId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs-confirmation">
          <Card>
            <CardHeader>
              <CardTitle>Sessions Needing Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList sessions={needsConfirmation} clubId={clubId} showConfirm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList sessions={pastConfirmed} clubId={clubId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
