import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSessionsList } from "./sessions-list";

async function getClubSessions(clubId: string) {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("club_id", clubId)
    .order("session_date", { ascending: false });
  return sessions || [];
}

export default async function AdminClubSessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessions = await getClubSessions(id);

  const now = new Date();
  // Use local date, not UTC (toISOString gives UTC)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5);

  const isSessionPast = (session: typeof sessions[0]) => {
    if (session.session_date < today) return true;
    if (session.session_date === today && session.start_time.slice(0, 5) <= currentTime) return true;
    return false;
  };

  const sortByDateTime = (a: typeof sessions[0], b: typeof sessions[0], ascending = true) => {
    const dateTimeA = `${a.session_date}T${a.start_time}`;
    const dateTimeB = `${b.session_date}T${b.start_time}`;
    return ascending
      ? dateTimeA.localeCompare(dateTimeB)
      : dateTimeB.localeCompare(dateTimeA);
  };

  const upcomingSessions = sessions
    .filter(s => !isSessionPast(s))
    .sort((a, b) => sortByDateTime(a, b, true));

  const pastConfirmed = sessions
    .filter(s => isSessionPast(s) && s.is_confirmed)
    .sort((a, b) => sortByDateTime(a, b, false));

  const needsConfirmation = sessions
    .filter(s => isSessionPast(s) && !s.is_confirmed)
    .sort((a, b) => sortByDateTime(a, b, true));

  return (
    <Tabs defaultValue="past" className="space-y-4">
      <TabsList>
        <TabsTrigger value="past">
          Past ({pastConfirmed.length})
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          Upcoming ({upcomingSessions.length})
        </TabsTrigger>
        <TabsTrigger value="needs-confirmation">
          Needs Confirmation ({needsConfirmation.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="past">
        <Card>
          <CardHeader>
            <CardTitle>Past Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSessionsList sessions={pastConfirmed} clubId={id} showViewDetails />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="upcoming">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSessionsList sessions={upcomingSessions} clubId={id} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="needs-confirmation">
        <Card>
          <CardHeader>
            <CardTitle>Sessions Needing Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSessionsList sessions={needsConfirmation} clubId={id} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
