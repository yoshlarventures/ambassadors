"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event, Region, User } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditEventDialogProps {
  event: Event & { regions?: Pick<Region, "name"> | null };
  regions: Region[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({
  event,
  regions,
  open,
  onOpenChange,
}: EditEventDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [regionId, setRegionId] = useState(event.region_id);
  const [eventDate, setEventDate] = useState(event.event_date);
  const [startTime, setStartTime] = useState(event.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(event.end_time?.slice(0, 5) || "");
  const [location, setLocation] = useState(event.location);
  const [maxAttendees, setMaxAttendees] = useState(
    event.max_attendees?.toString() || ""
  );

  // Reset form when event changes
  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description || "");
    setRegionId(event.region_id);
    setEventDate(event.event_date);
    setStartTime(event.start_time.slice(0, 5));
    setEndTime(event.end_time?.slice(0, 5) || "");
    setLocation(event.location);
    setMaxAttendees(event.max_attendees?.toString() || "");
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Track changes for logging
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (title !== event.title) changes.title = { from: event.title, to: title };
    if (description !== (event.description || "")) changes.description = { from: event.description, to: description };
    if (regionId !== event.region_id) changes.region_id = { from: event.region_id, to: regionId };
    if (eventDate !== event.event_date) changes.event_date = { from: event.event_date, to: eventDate };
    if (startTime !== event.start_time.slice(0, 5)) changes.start_time = { from: event.start_time, to: startTime };
    if (endTime !== (event.end_time?.slice(0, 5) || "")) changes.end_time = { from: event.end_time, to: endTime };
    if (location !== event.location) changes.location = { from: event.location, to: location };
    if (maxAttendees !== (event.max_attendees?.toString() || "")) changes.max_attendees = { from: event.max_attendees, to: maxAttendees ? parseInt(maxAttendees) : null };

    const { error } = await supabase
      .from("events")
      .update({
        title,
        description: description || null,
        region_id: regionId,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || null,
        location,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      })
      .eq("id", event.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Log the edit action with full details
    if (user && Object.keys(changes).length > 0) {
      await supabase.from("event_logs").insert({
        event_id: event.id,
        action: "edited",
        actor_id: user.id,
        details: {
          event_title: event.title,
          fields_changed: Object.keys(changes),
          changes,
        },
      });
    }

    toast.success("Event updated successfully!");
    onOpenChange(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Make changes to the event details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Startup Pitch Night"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select value={regionId} onValueChange={setRegionId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event venue address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value)}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this event about?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
