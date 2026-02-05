"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Trophy, ToggleLeft, ToggleRight, Trash } from "lucide-react";

type TaskWithCreator = Task & {
  creator: Pick<User, "full_name"> | null;
};

interface TasksListProps {
  tasks: TaskWithCreator[];
}

export function TasksList({ tasks }: TasksListProps) {
  const router = useRouter();

  const handleToggle = async (task: TaskWithCreator) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ is_active: !task.is_active })
      .eq("id", task.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(task.is_active ? "Task deactivated" : "Task activated");
      router.refresh();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Task deleted");
      router.refresh();
    }
  };

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No tasks found</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start justify-between p-4 border rounded-lg gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{task.title}</h3>
              <Badge variant="secondary">
                <Trophy className="mr-1 h-3 w-3" />
                {task.points} pts
              </Badge>
              {!task.is_active && (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {task.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </span>
              )}
              <span>Created by {task.creator?.full_name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggle(task)}
            >
              {task.is_active ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(task.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
