import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Check, Users, X } from "lucide-react";

async function getMemberClub(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  return membership;
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

async function getMemberAttendance(userId: string) {
  const supabase = await createClient();

  const { data: attendance } = await supabase
    .from("session_attendance")
    .select("session_id, attended")
    .eq("member_id", userId);

  // Create a map of session_id -> attended status
  const attendanceMap: Record<string, boolean> = {};
  attendance?.forEach(a => {
    attendanceMap[a.session_id] = a.attended;
  });

  return attendanceMap;
}

export default async function MemberSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMemberClub(user.id);
  if (!membership) {
    redirect("/member/my-club");
  }

  const [sessions, attendanceMap] = await Promise.all([
    getClubSessions(membership.club_id),
    getMemberAttendance(user.id),
  ]);

  const now = new Date();
  // Use local date, not UTC (toISOString gives UTC)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5);

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

  // Members only see upcoming and past confirmed sessions
  // Upcoming: soonest first (ascending)
  const upcomingSessions = sessions
    .filter(s => !isSessionPast(s))
    .sort((a, b) => sortByDateTime(a, b, true));

  // Past: most recent first (descending)
  const pastSessions = sessions
    .filter(s => isSessionPast(s) && s.is_confirmed)
    .sort((a, b) => sortByDateTime(a, b, false));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Club Sessions</h1>
        <p className="text-muted-foreground">Upcoming and past sessions</p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList sessions={upcomingSessions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList sessions={pastSessions} attendanceMap={attendanceMap} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionsList({ sessions, attendanceMap }: {
  sessions: Array<{
    id: string;
    title: string;
    description: string | null;
    session_date: string;
    start_time: string;
    end_time: string | null;
    location: string | null;
    is_confirmed: boolean;
    attendance_rate: number | null;
  }>;
  attendanceMap?: Record<string, boolean>;
}) {
  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No sessions found</p>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const hasAttendanceRecord = attendanceMap && session.id in attendanceMap;
        const wasPresent = hasAttendanceRecord ? attendanceMap[session.id] : null;

        return (
          <div
            key={session.id}
            className="p-4 border rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium">{session.title}</h3>
              {session.is_confirmed && (
                <Badge variant="secondary">
                  <Check className="mr-1 h-3 w-3" />
                  Confirmed
                </Badge>
              )}
              {session.is_confirmed && session.attendance_rate !== null && (
                <Badge variant={
                  session.attendance_rate >= 80 ? "default" :
                  session.attendance_rate >= 50 ? "secondary" :
                  "destructive"
                }>
                  <Users className="mr-1 h-3 w-3" />
                  {session.attendance_rate}%
                </Badge>
              )}
              {wasPresent === true && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="mr-1 h-3 w-3" />
                  Present
                </Badge>
              )}
              {wasPresent === false && (
                <Badge variant="destructive">
                  <X className="mr-1 h-3 w-3" />
                  Absent
                </Badge>
              )}
            </div>
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(session.session_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.start_time.slice(0, 5)}
                {session.end_time && ` - ${session.end_time.slice(0, 5)}`}
              </span>
              {session.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
