import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Search } from "lucide-react";
import Link from "next/link";

async function getMemberStats(userId: string) {
  const supabase = await createClient();

  // Get membership
  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id, status, clubs(name)")
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  // Get upcoming events
  const { count: upcomingEvents } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .gte("event_date", new Date().toISOString().split("T")[0]);

  return {
    membership,
    upcomingEvents: upcomingEvents || 0,
  };
}

export default async function MemberDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getMemberStats(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user.full_name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Club</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.membership ? (
              <div className="text-lg font-medium">
                {(stats.membership.clubs as unknown as { name: string })?.name || "Club"}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Not a member of any club</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          </CardContent>
        </Card>
      </div>

      {!stats.membership && (
        <Card>
          <CardHeader>
            <CardTitle>Join a Club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You&apos;re not a member of any club yet. Browse available clubs and request to join one.
            </p>
            <Link href="/member/clubs">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Clubs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {stats.membership && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/member/my-club">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  View My Club
                </Button>
              </Link>
              <Link href="/member/events">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
