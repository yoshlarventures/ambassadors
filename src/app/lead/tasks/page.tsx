import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadTasksList } from "./lead-tasks-list";

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, region_id")
    .eq("id", user.id)
    .single();

  return profile;
}

async function getActiveTasks() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return tasks || [];
}

async function getUserCompletions(userId: string) {
  const supabase = await createClient();
  const { data: completions } = await supabase
    .from("task_completions")
    .select("*, tasks(title, points)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return completions || [];
}

export default async function LeadTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader") {
    redirect("/");
  }

  const [tasks, completions] = await Promise.all([
    getActiveTasks(),
    getUserCompletions(user.id),
  ]);

  const completedTaskIds = completions.map(c => c.task_id);
  const availableTasks = tasks.filter(t => !completedTaskIds.includes(t.id));
  const pendingCompletions = completions.filter(c => c.status === "pending");
  const approvedCompletions = completions.filter(c => c.status === "approved");
  const rejectedCompletions = completions.filter(c => c.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Complete tasks to earn points</p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available ({availableTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCompletions.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCompletions.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCompletions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTasksList tasks={availableTasks} userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTasksList completions={pendingCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTasksList completions={approvedCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTasksList completions={rejectedCompletions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
