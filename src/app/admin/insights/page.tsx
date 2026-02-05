import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Building2,
  Calendar,
  FileText,
  Trophy,
  TrendingUp,
  MapPin,
} from "lucide-react";

async function getInsights() {
  const supabase = await createClient();

  const [
    usersResult,
    clubsResult,
    eventsResult,
    sessionsResult,
    reportsResult,
    pointsResult,
  ] = await Promise.all([
    supabase.from("users").select("id, role, region_id, created_at"),
    supabase.from("clubs").select("id, region_id, created_at"),
    supabase.from("events").select("id, status, region_id, confirmed_attendees, created_at"),
    supabase.from("sessions").select("id, is_confirmed, created_at"),
    supabase.from("reports").select("id, status"),
    supabase.from("points").select("user_id, amount"),
  ]);

  const users = usersResult.data || [];
  const clubs = clubsResult.data || [];
  const events = eventsResult.data || [];
  const sessions = sessionsResult.data || [];
  const reports = reportsResult.data || [];
  const points = pointsResult.data || [];

  // Calculate stats
  const totalUsers = users.length;
  const ambassadors = users.filter(u => u.role === "ambassador").length;
  const regionalLeaders = users.filter(u => u.role === "regional_leader").length;
  const members = users.filter(u => u.role === "member").length;

  const totalClubs = clubs.length;
  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.status === "completed").length;
  const totalEventAttendance = events.reduce((sum, e) => sum + (e.confirmed_attendees || 0), 0);

  const totalSessions = sessions.length;
  const confirmedSessions = sessions.filter(s => s.is_confirmed).length;

  const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

  // Top performers
  const userPoints: Record<string, number> = {};
  points.forEach(p => {
    userPoints[p.user_id] = (userPoints[p.user_id] || 0) + p.amount;
  });

  return {
    totalUsers,
    ambassadors,
    regionalLeaders,
    members,
    totalClubs,
    totalEvents,
    completedEvents,
    totalEventAttendance,
    totalSessions,
    confirmedSessions,
    totalPoints,
    approvedReports: reports.filter(r => r.status === "approved").length,
    pendingReports: reports.filter(r => r.status === "submitted").length,
  };
}

async function getRegionalStats() {
  const supabase = await createClient();

  const { data: regions } = await supabase.from("regions").select("id, name");

  if (!regions) return [];

  const stats = await Promise.all(
    regions.map(async (region) => {
      const [usersResult, clubsResult, eventsResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).eq("region_id", region.id).eq("role", "ambassador"),
        supabase.from("clubs").select("id", { count: "exact", head: true }).eq("region_id", region.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("region_id", region.id).eq("status", "completed"),
      ]);

      return {
        region: region.name,
        ambassadors: usersResult.count || 0,
        clubs: clubsResult.count || 0,
        events: eventsResult.count || 0,
      };
    })
  );

  return stats.sort((a, b) => b.events - a.events);
}

async function getTopPerformers() {
  const supabase = await createClient();

  const { data: points } = await supabase
    .from("points")
    .select("user_id, amount, users(full_name, region_id, regions(name))");

  if (!points) return [];

  const userPoints: Record<string, { name: string; region: string; total: number }> = {};

  points.forEach((p) => {
    const user = p.users as unknown as { full_name: string; region_id: string | null; regions: { name: string } | null } | null;
    if (!user) return;

    if (!userPoints[p.user_id]) {
      userPoints[p.user_id] = {
        name: user.full_name,
        region: user.regions?.name || "No region",
        total: 0,
      };
    }
    userPoints[p.user_id].total += p.amount;
  });

  return Object.values(userPoints)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export default async function AdminInsightsPage() {
  const [insights, regionalStats, topPerformers] = await Promise.all([
    getInsights(),
    getRegionalStats(),
    getTopPerformers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insights</h1>
        <p className="text-muted-foreground">Platform analytics and statistics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {insights.ambassadors} ambassadors, {insights.members} members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalClubs}</div>
            <p className="text-xs text-muted-foreground">Active startup clubs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.completedEvents}</div>
            <p className="text-xs text-muted-foreground">
              {insights.totalEventAttendance} total attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.confirmedSessions}</div>
            <p className="text-xs text-muted-foreground">Confirmed club sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Regional Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Ambassadors</TableHead>
                  <TableHead className="text-right">Clubs</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionalStats.slice(0, 10).map((stat) => (
                  <TableRow key={stat.region}>
                    <TableCell className="font-medium">{stat.region}</TableCell>
                    <TableCell className="text-right">{stat.ambassadors}</TableCell>
                    <TableCell className="text-right">{stat.clubs}</TableCell>
                    <TableCell className="text-right">{stat.events}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Ambassador</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((performer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{performer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{performer.region}</TableCell>
                    <TableCell className="text-right font-medium">{performer.total}</TableCell>
                  </TableRow>
                ))}
                {topPerformers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.approvedReports}</div>
            <p className="text-xs text-muted-foreground">
              {insights.pendingReports} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regional Leaders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.regionalLeaders}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
