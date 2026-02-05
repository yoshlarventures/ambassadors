"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface EditSessionDialogProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSessionDialog({ session, open, onOpenChange }: EditSessionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || "");
  const [sessionDate, setSessionDate] = useState(session.session_date);
  const [startTime, setStartTime] = useState(session.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(session.end_time?.slice(0, 5) || "");
  const [location, setLocation] = useState(session.location || "");

  useEffect(() => {
    if (open) {
      setTitle(session.title);
      setDescription(session.description || "");
      setSessionDate(session.session_date);
      setStartTime(session.start_time.slice(0, 5));
      setEndTime(session.end_time?.slice(0, 5) || "");
      setLocation(session.location || "");
    }
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        title,
        description: description || null,
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime || null,
        location: location || null,
      })
      .eq("id", session.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Session updated successfully!");
      onOpenChange(false);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the session details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Meetup"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sessionDate">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    // Clear end time if it's now before start time
                    if (endTime && e.target.value && endTime <= e.target.value) {
                      setEndTime("");
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || undefined}
                  disabled={!startTime}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where will the session be held?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will this session cover?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
