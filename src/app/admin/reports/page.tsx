import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

async function getAllReports() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      ambassador:users!reports_ambassador_id_fkey(full_name),
      clubs(name, regions(name)),
      reviewer:users!reports_reviewer_id_fkey(full_name)
    `)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  return reports || [];
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Ambassador</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {MONTHS[report.month - 1]} {report.year}
                  </TableCell>
                  <TableCell>
                    {(report.ambassador as { full_name: string } | null)?.full_name}
                  </TableCell>
                  <TableCell>
                    {(report.clubs as { name: string } | null)?.name}
                  </TableCell>
                  <TableCell>
                    {(report.clubs as { regions: { name: string } | null } | null)?.regions?.name}
                  </TableCell>
                  <TableCell>{report.sessions_count}</TableCell>
                  <TableCell>{report.events_count}</TableCell>
                  <TableCell>{report.points_earned}</TableCell>
                  <TableCell>
                    <Badge variant={
                      report.status === "approved" ? "default" :
                      report.status === "submitted" ? "outline" :
                      report.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {report.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
