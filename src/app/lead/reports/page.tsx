import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadReportsList } from "./lead-reports-list";

async function getRegionReports(regionId: string) {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      ambassador:users!reports_ambassador_id_fkey(full_name),
      clubs!inner(name, region_id)
    `)
    .eq("clubs.region_id", regionId)
    .order("submitted_at", { ascending: false });
  return reports || [];
}

export default async function LeadReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.region_id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Review ambassador reports</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You need to be assigned to a region to review reports.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reports = await getRegionReports(user.region_id);

  const pending = reports.filter(r => r.status === "submitted");
  const approved = reports.filter(r => r.status === "approved");
  const rejected = reports.filter(r => r.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Review reports from your region</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadReportsList reports={pending} userId={user.id} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadReportsList reports={approved} userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadReportsList reports={rejected} userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
