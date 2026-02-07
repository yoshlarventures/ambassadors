import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmbassadorTasksList } from "./ambassador-tasks-list";

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

export default async function AmbassadorTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tasks, completions] = await Promise.all([
    getActiveTasks(),
    getUserCompletions(user.id),
  ]);

  const pendingCompletions = completions.filter(c => c.status === "pending");
  const approvedCompletions = completions.filter(c => c.status === "approved");
  const rejectedCompletions = completions.filter(c => c.status === "rejected");

  // A task is available if: approved count < max_completions AND no pending submission
  const availableTasks = tasks.filter(t => {
    const approvedCount = approvedCompletions.filter(c => c.task_id === t.id).length;
    const hasPending = pendingCompletions.some(c => c.task_id === t.id);
    return approvedCount < (t.max_completions ?? 1) && !hasPending;
  });

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
              <AmbassadorTasksList tasks={availableTasks} userId={user.id} approvedCounts={
                Object.fromEntries(availableTasks.map(t => [t.id, approvedCompletions.filter(c => c.task_id === t.id).length]))
              } />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <AmbassadorTasksList completions={pendingCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <AmbassadorTasksList completions={approvedCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <AmbassadorTasksList completions={rejectedCompletions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
