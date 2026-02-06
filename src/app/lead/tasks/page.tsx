import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

async function getTasks() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, creator:users!tasks_created_by_fkey(full_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return tasks || [];
}

export default async function LeadTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader" || !user.region_id) {
    redirect("/");
  }

  const tasks = await getTasks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">View active tasks for ambassadors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadTasksList tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}
