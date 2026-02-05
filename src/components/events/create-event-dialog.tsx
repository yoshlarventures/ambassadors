"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Region, User } from "@/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateEventDialogProps {
  userId: string;
  userRegionId: string | null;
  regions: Region[];
  ambassadors: Pick<User, "id" | "full_name">[];
  isAdmin?: boolean;
}

export function CreateEventDialog({
  userId,
  userRegionId,
  regions,
  ambassadors,
  isAdmin = false,
}: CreateEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [regionId, setRegionId] = useState(userRegionId || "");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    // Create event - admins can create approved events directly
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title,
        description: description || null,
        organizer_id: userId,
        region_id: regionId,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || null,
        location,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        status: isAdmin ? "approved" : "pending_approval",
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Add collaborators
    if (collaborators.length > 0) {
      const { error: collabError } = await supabase
        .from("event_collaborators")
        .insert(
          collaborators.map(collabUserId => ({
            event_id: event.id,
            user_id: collabUserId,
          }))
        );

      if (collabError) {
        toast.error("Event created but failed to add collaborators");
      }
    }

    // Log the action with full details
    await supabase.from("event_logs").insert({
      event_id: event.id,
      action: "created",
      actor_id: userId,
      details: {
        title,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || null,
        location,
        region_id: regionId,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        collaborators: collaborators.length > 0 ? collaborators : null,
        status: isAdmin ? "approved" : "pending_approval",
      },
    });

    toast.success(isAdmin ? "Event created successfully!" : "Event submitted for approval!");
    setOpen(false);
    resetForm();
    router.refresh();
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRegionId(userRegionId || "");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setMaxAttendees("");
    setCollaborators([]);
  };

  const addCollaborator = (ambassadorId: string) => {
    if (collaborators.length < 2 && !collaborators.includes(ambassadorId)) {
      setCollaborators([...collaborators, ambassadorId]);
    }
  };

  const removeCollaborator = (ambassadorId: string) => {
    setCollaborators(collaborators.filter(id => id !== ambassadorId));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "Create an event that will be published immediately. You can add up to 2 collaborators."
                : "Create an event for approval. You can add up to 2 collaborators."}
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

            <div className="space-y-2">
              <Label>Collaborators (max 2)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {collaborators.map(id => {
                  const ambassador = ambassadors.find(a => a.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {ambassador?.full_name}
                      <button
                        type="button"
                        onClick={() => removeCollaborator(id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              {collaborators.length < 2 && (
                <Select onValueChange={addCollaborator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add collaborator" />
                  </SelectTrigger>
                  <SelectContent>
                    {ambassadors
                      .filter(a => !collaborators.includes(a.id))
                      .map(ambassador => (
                        <SelectItem key={ambassador.id} value={ambassador.id}>
                          {ambassador.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdmin ? "Create Event" : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
