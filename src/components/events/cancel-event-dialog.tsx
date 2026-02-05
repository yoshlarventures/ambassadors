"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CancelEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelEventDialog({
  event,
  open,
  onOpenChange,
}: CancelEventDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();

    // Update event status
    const { error } = await supabase
      .from("events")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
      })
      .eq("id", event.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Log the action with details
    if (user) {
      await supabase.from("event_logs").insert({
        event_id: event.id,
        action: "cancelled",
        actor_id: user.id,
        details: {
          event_title: event.title,
          event_date: event.event_date,
          location: event.location,
          reason,
        },
      });
    }

    toast.success("Event cancelled");
    setReason("");
    onOpenChange(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogDescription>
            Cancel &quot;{event.title}&quot;. This action will notify the organizer
            and collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this event being cancelled?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Event
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
