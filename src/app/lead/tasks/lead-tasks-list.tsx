"use client";

import { Task, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";

type TaskWithCreator = Task & {
  creator: Pick<User, "full_name"> | null;
};

interface LeadTasksListProps {
  tasks: TaskWithCreator[];
}

export function LeadTasksList({ tasks }: LeadTasksListProps) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No tasks found</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="p-4 border rounded-lg"
        >
          <div className="flex items-start justify-between gap-4">
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
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
                <span>Created by {task.creator?.full_name}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
