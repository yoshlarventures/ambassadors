import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadTasksList } from "./lead-tasks-list";
import { LeadTaskCompletionsList } from "./lead-task-completions-list";

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

async function getTasks() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, creator:users!tasks_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });
  return tasks || [];
}

async function getPendingCompletions(regionId: string) {
  const supabase = await createClient();

  // First get users in this region
  const { data: regionUsers } = await supabase
    .from("users")
    .select("id")
    .eq("region_id", regionId)
    .eq("role", "ambassador");

  if (!regionUsers || regionUsers.length === 0) {
    return [];
  }

  const userIds = regionUsers.map(u => u.id);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("*, tasks(title, points), users(full_name, email)")
    .eq("status", "pending")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  return completions || [];
}

async function getReviewedCompletions(regionId: string) {
  const supabase = await createClient();

  // First get users in this region
  const { data: regionUsers } = await supabase
    .from("users")
    .select("id")
    .eq("region_id", regionId)
    .eq("role", "ambassador");

  if (!regionUsers || regionUsers.length === 0) {
    return [];
  }

  const userIds = regionUsers.map(u => u.id);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("*, tasks(title, points), users(full_name, email), reviewer:users!task_completions_reviewer_id_fkey(full_name)")
    .in("status", ["approved", "rejected"])
    .in("user_id", userIds)
    .order("reviewed_at", { ascending: false })
    .limit(50);

  return completions || [];
}

export default async function LeadTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader" || !user.region_id) {
    redirect("/");
  }

  const [tasks, pendingCompletions, reviewedCompletions] = await Promise.all([
    getTasks(),
    getPendingCompletions(user.region_id),
    getReviewedCompletions(user.region_id),
  ]);

  const activeTasks = tasks.filter(t => t.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Review task submissions from ambassadors in your region</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingCompletions.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Recently Reviewed
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Active Tasks ({activeTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Task Submissions Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTaskCompletionsList completions={pendingCompletions} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewed">
          <Card>
            <CardHeader>
              <CardTitle>Recently Reviewed Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTaskCompletionsList completions={reviewedCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTasksList tasks={activeTasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
