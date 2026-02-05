import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Calendar, Search } from "lucide-react";
import Link from "next/link";

async function getMemberClub(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("club_members")
    .select(`
      *,
      clubs(
        *,
        club_ambassadors(
          is_primary,
          ambassador:users!club_ambassadors_ambassador_id_fkey(full_name, email)
        ),
        regions(name),
        sessions(id, title, session_date, start_time, is_confirmed, attendance_rate)
      )
    `)
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  return membership;
}

export default async function MemberMyClubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMemberClub(user.id);

  if (!membership) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Club</h1>
          <p className="text-muted-foreground">You are not a member of any club yet</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold">No Club Membership</h3>
            <p className="text-muted-foreground mb-4">
              Browse available clubs and request to join one
            </p>
            <Link href="/member/clubs">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Clubs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const club = membership.clubs as {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    club_ambassadors: Array<{
      ambassador: { full_name: string; email: string } | null;
    }> | null;
    regions: { name: string } | null;
    sessions: Array<{
      id: string;
      title: string;
      session_date: string;
      start_time: string;
      is_confirmed: boolean;
      attendance_rate: number | null;
    }>;
  };

  // Get all ambassador names
  const ambassadors = club.club_ambassadors
    ?.filter(a => a.ambassador)
    .map(a => a.ambassador!.full_name) || [];

  // Calculate overall attendance rate
  const confirmedSessions = club.sessions?.filter(s => s.is_confirmed && s.attendance_rate !== null) || [];
  const overallAttendanceRate = confirmedSessions.length > 0
    ? Math.round(confirmedSessions.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / confirmedSessions.length)
    : null;

  const now = new Date();
  // Use local date, not UTC (toISOString gives UTC)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Session is upcoming if:
  // 1. Date is in the future, OR
  // 2. Date is today AND start_time has NOT passed yet
  const isSessionUpcoming = (session: typeof club.sessions[0]) => {
    if (session.session_date > today) return true;
    if (session.session_date === today && session.start_time.slice(0, 5) > currentTime) return true;
    return false;
  };

  const upcomingSessions = club.sessions
    ?.filter(s => isSessionUpcoming(s))
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Club</h1>
        <p className="text-muted-foreground">
          Member since {new Date(membership.joined_at).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{club.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {club.regions?.name}
              </CardDescription>
            </div>
            <Badge>Member</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {club.description && (
            <p className="text-muted-foreground">{club.description}</p>
          )}
          {club.address && (
            <p className="text-sm">
              <span className="font-medium">Location:</span> {club.address}
            </p>
          )}
          <p className="text-sm">
            <span className="font-medium">Ambassadors:</span> {ambassadors.length > 0 ? ambassadors.join(", ") : "Unknown"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Attendance Rate:</span>{" "}
            {overallAttendanceRate !== null ? (
              <span className={`font-semibold ${
                overallAttendanceRate >= 80 ? "text-green-600" :
                overallAttendanceRate >= 50 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {overallAttendanceRate}%
              </span>
            ) : (
              <span className="text-muted-foreground">No data yet</span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No upcoming sessions scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()} at{" "}
                      {session.start_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
