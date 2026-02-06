"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TaskCompletion, Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, Trophy } from "lucide-react";

type CompletionWithRelations = TaskCompletion & {
  tasks: Pick<Task, "title" | "points"> | null;
  users: Pick<User, "full_name" | "email"> | null;
  reviewer?: Pick<User, "full_name"> | null;
};

interface LeadTaskCompletionsListProps {
  completions: CompletionWithRelations[];
  showActions?: boolean;
}

export function LeadTaskCompletionsList({ completions, showActions }: LeadTaskCompletionsListProps) {
  const router = useRouter();

  const handleApprove = async (completion: CompletionWithRelations) => {
    const supabase = createClient();

    // Get current user for reviewer_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    // Update completion status
    const { error: completionError } = await supabase
      .from("task_completions")
      .update({
        status: "approved",
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", completion.id);

    if (completionError) {
      toast.error(completionError.message);
      return;
    }

    // Award points
    const { error: pointsError } = await supabase.from("points").insert({
      user_id: completion.user_id,
      amount: completion.tasks?.points || 0,
      reason: `Task completed: ${completion.tasks?.title}`,
      reference_type: "task",
      reference_id: completion.task_id,
    });

    if (pointsError) {
      toast.error("Approved but failed to award points");
    } else {
      toast.success("Task approved and points awarded!");
    }

    router.refresh();
  };

  const handleReject = async (completionId: string) => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from("task_completions")
      .update({
        status: "rejected",
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", completionId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Task submission rejected");
      router.refresh();
    }
  };

  if (completions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No submissions found</p>;
  }

  return (
    <div className="space-y-4">
      {completions.map((completion) => (
        <div
          key={completion.id}
          className="flex items-start justify-between p-4 border rounded-lg gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{completion.tasks?.title}</h3>
              <Badge variant="secondary">
                <Trophy className="mr-1 h-3 w-3" />
                {completion.tasks?.points} pts
              </Badge>
              {!showActions && (
                <Badge variant={completion.status === "approved" ? "default" : "destructive"}>
                  {completion.status}
                </Badge>
              )}
            </div>
            <p className="text-sm">
              Submitted by{" "}
              <span className="font-medium">{completion.users?.full_name}</span>
              <span className="text-muted-foreground"> ({completion.users?.email})</span>
            </p>
            {completion.notes && (
              <p className="text-sm text-muted-foreground">{completion.notes}</p>
            )}
            {completion.proof_url && (
              <a
                href={completion.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                View Proof <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(completion.created_at).toLocaleString()}
              {completion.reviewer && completion.reviewed_at && (
                <> • Reviewed by {completion.reviewer.full_name} on {new Date(completion.reviewed_at).toLocaleString()}</>
              )}
            </p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(completion)}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(completion.id)}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
