import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsList } from "./reports-list";
import { CreateReportDialog } from "./create-report-dialog";

async function getAmbassadorReports(ambassadorId: string) {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*, reviewer:users!reports_reviewer_id_fkey(full_name)")
    .eq("ambassador_id", ambassadorId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  return reports || [];
}

async function getClub(ambassadorId: string) {
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("club_ambassadors")
    .select("club:clubs(id, name)")
    .eq("ambassador_id", ambassadorId)
    .limit(1)
    .single();
  return assignment?.club as unknown as { id: string; name: string } | null;
}

export default async function AmbassadorReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const club = await getClub(user.id);

  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Monthly activity reports</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You need to create a club first before submitting reports.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reports = await getAmbassadorReports(user.id);

  const drafts = reports.filter(r => r.status === "draft");
  const submitted = reports.filter(r => r.status === "submitted");
  const approved = reports.filter(r => r.status === "approved");
  const rejected = reports.filter(r => r.status === "rejected");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Monthly activity reports for {club.name}</p>
        </div>
        <CreateReportDialog clubId={club.id} userId={user.id} existingReports={reports} />
      </div>

      <Tabs defaultValue="drafts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Draft Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsList reports={drafts} showEdit />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsList reports={submitted} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsList reports={approved} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsList reports={rejected} showRejectionReason showEdit />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
