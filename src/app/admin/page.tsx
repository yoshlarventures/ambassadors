import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Calendar, MapPin, GraduationCap, Trophy } from "lucide-react";
import { SyncExodePointsButton } from "./sync-exode-points-button";
import { RetroactivePointsButton } from "./retroactive-points-button";

async function getStats() {
  const supabase = await createClient();

  const [usersResult, clubsResult, eventsResult, regionsResult, exodeLinkedResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("regions").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).not("exode_user_id", "is", null),
  ]);

  return {
    usersCount: usersResult.count || 0,
    clubsCount: clubsResult.count || 0,
    eventsCount: eventsResult.count || 0,
    regionsCount: regionsResult.count || 0,
    exodeLinkedCount: exodeLinkedResult.count || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clubsCount}</div>
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
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regionsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Exode Integration Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Exode LMS Integration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.exodeLinkedCount} users have linked their Exode accounts
            </p>
          </div>
          <SyncExodePointsButton />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sync course points from Exode to update the leaderboard with learning progress.
          </p>
        </CardContent>
      </Card>

      {/* Member Points Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Member Attendance Points
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Award 30 points for each session attendance
            </p>
          </div>
          <RetroactivePointsButton />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use this to award points for attendance records created before the points system was enabled.
            This only needs to be run once - future attendance will automatically award points.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
