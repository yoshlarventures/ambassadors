"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCompletion } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trophy, Calendar, Loader2, Check, X, Clock, RefreshCw } from "lucide-react";

type CompletionWithTask = TaskCompletion & {
  tasks: Pick<Task, "title" | "points"> | null;
};

interface AmbassadorTasksListProps {
  tasks?: Task[];
  userId?: string;
  completions?: CompletionWithTask[];
}

export function AmbassadorTasksList({
  tasks,
  userId,
  completions,
}: AmbassadorTasksListProps) {
  const router = useRouter();
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [resubmitCompletion, setResubmitCompletion] = useState<CompletionWithTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!submitTask || !userId) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("task_completions").insert({
      task_id: submitTask.id,
      user_id: userId,
      proof_url: proofUrl || null,
      notes: notes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already submitted this task");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Task submitted for review!");
      setSubmitTask(null);
      setProofUrl("");
      setNotes("");
      router.refresh();
    }

    setLoading(false);
  };

  const handleResubmit = async () => {
    if (!resubmitCompletion) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("task_completions")
      .update({
        proof_url: proofUrl || null,
        notes: notes || null,
        status: "pending",
        reviewed_at: null,
        reviewer_id: null,
      })
      .eq("id", resubmitCompletion.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Task resubmitted for review!");
      setResubmitCompletion(null);
      setProofUrl("");
      setNotes("");
      router.refresh();
    }

    setLoading(false);
  };

  const openResubmitDialog = (completion: CompletionWithTask) => {
    setProofUrl(completion.proof_url || "");
    setNotes(completion.notes || "");
    setResubmitCompletion(completion);
  };

  // Resubmit Dialog component (used by completions view)
  const resubmitDialog = (
    <Dialog open={!!resubmitCompletion} onOpenChange={(open) => !open && setResubmitCompletion(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resubmit Task</DialogTitle>
          <DialogDescription>
            Update and resubmit &quot;{resubmitCompletion?.tasks?.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resubmitProofUrl">Proof URL (optional)</Label>
            <Input
              id="resubmitProofUrl"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Link to screenshot, post, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resubmitNotes">Notes (optional)</Label>
            <Textarea
              id="resubmitNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setResubmitCompletion(null)}>
            Cancel
          </Button>
          <Button onClick={handleResubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resubmit Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Show completions if provided
  if (completions) {
    if (completions.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No tasks found</p>;
    }

    return (
      <>
        <div className="space-y-4">
          {completions.map((completion) => (
            <div
              key={completion.id}
              className="flex items-start justify-between p-4 border rounded-lg gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{completion.tasks?.title}</h3>
                  <Badge variant="secondary">
                    <Trophy className="mr-1 h-3 w-3" />
                    {completion.tasks?.points} pts
                  </Badge>
                  <Badge variant={
                    completion.status === "approved" ? "default" :
                    completion.status === "rejected" ? "destructive" :
                    "outline"
                  }>
                    {completion.status === "approved" && <Check className="mr-1 h-3 w-3" />}
                    {completion.status === "rejected" && <X className="mr-1 h-3 w-3" />}
                    {completion.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {completion.status}
                  </Badge>
                </div>
                {completion.notes && (
                  <p className="text-sm text-muted-foreground">{completion.notes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(completion.created_at).toLocaleString()}
                </p>
              </div>
              {completion.status === "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openResubmitDialog(completion)}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Resubmit
                </Button>
              )}
            </div>
          ))}
        </div>
        {resubmitDialog}
      </>
    );
  }

  // Show available tasks
  if (!tasks || tasks.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No tasks available</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start justify-between p-4 border rounded-lg gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <Badge variant="secondary">
                  <Trophy className="mr-1 h-3 w-3" />
                  {task.points} pts
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              {task.deadline && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => setSubmitTask(task)}>
              Submit
            </Button>
          </div>
        ))}
      </div>

      {/* Submit Dialog */}
      <Dialog open={!!submitTask} onOpenChange={(open) => !open && setSubmitTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task</DialogTitle>
            <DialogDescription>
              Submit proof of completing &quot;{submitTask?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proofUrl">Proof URL (optional)</Label>
              <Input
                id="proofUrl"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="Link to screenshot, post, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
