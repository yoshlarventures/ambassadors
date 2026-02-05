import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksList } from "./tasks-list";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskCompletionsList } from "./task-completions-list";

async function getTasks() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, creator:users!tasks_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });
  return tasks || [];
}

async function getPendingCompletions() {
  const supabase = await createClient();
  const { data: completions } = await supabase
    .from("task_completions")
    .select("*, tasks(title, points), users(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return completions || [];
}

export default async function AdminTasksPage() {
  const [tasks, pendingCompletions] = await Promise.all([
    getTasks(),
    getPendingCompletions(),
  ]);

  const activeTasks = tasks.filter(t => t.is_active);
  const inactiveTasks = tasks.filter(t => !t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Create tasks for ambassadors to earn points</p>
        </div>
        <CreateTaskDialog />
      </div>

      <Tabs defaultValue="pending-completions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending-completions">
            Pending Review ({pendingCompletions.length})
          </TabsTrigger>
          <TabsTrigger value="active">Active Tasks ({activeTasks.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-completions">
          <Card>
            <CardHeader>
              <CardTitle>Task Submissions Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskCompletionsList completions={pendingCompletions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TasksList tasks={activeTasks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TasksList tasks={inactiveTasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
