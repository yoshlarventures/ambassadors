import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Calendar, FileText } from "lucide-react";

async function getRegionStats(regionId: string | null) {
  if (!regionId) return { ambassadorsCount: 0, clubsCount: 0, eventsCount: 0, pendingReports: 0 };

  const supabase = await createClient();

  const [ambassadorsResult, clubsResult, eventsResult, reportsResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("region_id", regionId).eq("role", "ambassador"),
    supabase.from("clubs").select("id", { count: "exact", head: true }).eq("region_id", regionId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("region_id", regionId),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "submitted"),
  ]);

  return {
    ambassadorsCount: ambassadorsResult.count || 0,
    clubsCount: clubsResult.count || 0,
    eventsCount: eventsResult.count || 0,
    pendingReports: reportsResult.count || 0,
  };
}

export default async function LeadDashboard() {
  const user = await getCurrentUser();
  const stats = await getRegionStats(user?.region_id || null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regional Leader Dashboard</h1>
        <p className="text-muted-foreground">Manage your region&apos;s ambassadors and activities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambassadors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ambassadorsCount}</div>
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
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
