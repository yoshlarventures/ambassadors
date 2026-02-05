import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Trophy, FileText, Plus } from "lucide-react";
import Link from "next/link";

async function getAmbassadorStats(userId: string) {
  const supabase = await createClient();

  // Get club through club_ambassadors junction table
  const { data: clubAssignment } = await supabase
    .from("club_ambassadors")
    .select("club_id")
    .eq("ambassador_id", userId)
    .limit(1)
    .single();

  if (!clubAssignment) {
    return { hasClub: false, membersCount: 0, sessionsCount: 0, eventsCount: 0, totalPoints: 0 };
  }

  const clubId = clubAssignment.club_id;

  const [membersResult, sessionsResult, eventsResult, pointsResult] = await Promise.all([
    supabase.from("club_members").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "approved"),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("organizer_id", userId),
    supabase.from("points").select("amount").eq("user_id", userId),
  ]);

  const totalPoints = pointsResult.data?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return {
    hasClub: true,
    membersCount: membersResult.count || 0,
    sessionsCount: sessionsResult.count || 0,
    eventsCount: eventsResult.count || 0,
    totalPoints,
  };
}

export default async function AmbassadorDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getAmbassadorStats(user.id);

  if (!stats.hasClub) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ambassador Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user.full_name}!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Club Assigned</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You haven&apos;t been assigned to a club yet. Contact your Regional Leader or Admin to be assigned to a club.
            </p>
            <Link href="/ambassador/my-club">
              <Button variant="outline">
                View My Club Status
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ambassador Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.full_name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.membersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/ambassador/my-club/sessions">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Session
              </Button>
            </Link>
            <Link href="/ambassador/events">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
            <Link href="/ambassador/reports">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
