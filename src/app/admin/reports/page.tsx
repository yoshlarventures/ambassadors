import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminReportsTable } from "./admin-reports-table";

async function getAllReports() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      ambassador:users!reports_ambassador_id_fkey(id, full_name),
      clubs(name, regions(name)),
      reviewer:users!reports_reviewer_id_fkey(full_name)
    `)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (!reports || reports.length === 0) return [];

  // Get all ambassador IDs
  const ambassadorIds = Array.from(new Set(reports.map(r => r.ambassador?.id).filter(Boolean)));

  // Fetch all clubs for these ambassadors
  const { data: clubAmbassadors } = await supabase
    .from("club_ambassadors")
    .select("ambassador_id, clubs(id, name)")
    .in("ambassador_id", ambassadorIds);

  // Map ambassador_id to their clubs
  const ambassadorClubsMap = new Map<string, string[]>();
  clubAmbassadors?.forEach((ca) => {
    const club = ca.clubs as unknown as { id: string; name: string } | null;
    if (club) {
      const existing = ambassadorClubsMap.get(ca.ambassador_id) || [];
      existing.push(club.name);
      ambassadorClubsMap.set(ca.ambassador_id, existing);
    }
  });

  // Attach all clubs to each report
  return reports.map(report => ({
    ...report,
    all_clubs: report.ambassador?.id ? ambassadorClubsMap.get(report.ambassador.id) || [] : [],
  }));
}

export default async function AdminReportsPage() {
  const reports = await getAllReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View all ambassador reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminReportsTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
