"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event, User, Region } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Clock, MapPin, Users, Check, X, Trash, AlertCircle, Loader2, Image as ImageIcon, Eye, Ban, Pencil } from "lucide-react";
import { EventDetailDialog } from "@/components/events/event-detail-dialog";
import { CancelEventDialog } from "@/components/events/cancel-event-dialog";
import { EditEventDialog } from "@/components/events/edit-event-dialog";

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

interface AdminEventsListProps {
  events: EventWithRelations[];
  regions: Region[];
  showApprovalActions?: boolean;
  showRejectionReason?: boolean;
}

export function AdminEventsList({
  events,
  regions,
  showApprovalActions,
  showRejectionReason,
}: AdminEventsListProps) {
  const router = useRouter();
  const [rejectEvent, setRejectEvent] = useState<EventWithRelations | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<EventWithRelations | null>(null);
  const [cancelEvent, setCancelEvent] = useState<EventWithRelations | null>(null);
  const [editEvent, setEditEvent] = useState<EventWithRelations | null>(null);

  const handleApprove = async (eventId: string) => {
    setLoading(eventId);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("events")
      .update({ status: "approved" })
      .eq("id", eventId);

    if (error) {
      toast.error(error.message);
    } else {
      // Log the action with details
      if (user) {
        const event = events.find(e => e.id === eventId);
        await supabase.from("event_logs").insert({
          event_id: eventId,
          action: "approved",
          actor_id: user.id,
          details: {
            event_title: event?.title,
            event_date: event?.event_date,
            organizer: event?.organizer?.full_name,
          },
        });
      }
      toast.success("Event approved!");
      router.refresh();
    }
    setLoading(null);
  };

  const handleReject = async () => {
    if (!rejectEvent) return;
    setLoading(rejectEvent.id);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("events")
      .update({
        status: "rejected",
        rejection_reason: rejectReason || null,
      })
      .eq("id", rejectEvent.id);

    if (error) {
      toast.error(error.message);
    } else {
      // Log the action with details
      if (user) {
        await supabase.from("event_logs").insert({
          event_id: rejectEvent.id,
          action: "rejected",
          actor_id: user.id,
          details: {
            event_title: rejectEvent.title,
            event_date: rejectEvent.event_date,
            organizer: rejectEvent.organizer?.full_name,
            reason: rejectReason || null,
          },
        });
      }
      toast.success("Event rejected");
      setRejectEvent(null);
      setRejectReason("");
      router.refresh();
    }
    setLoading(null);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setLoading(eventId);
    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Event deleted");
      router.refresh();
    }
    setLoading(null);
  };

  if (events.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No events found</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => {
          const photoCount = event.event_photos?.length || 0;

          return (
          <div
            key={event.id}
            className="flex flex-col md:flex-row md:items-start justify-between p-4 border rounded-lg gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{event.title}</h3>
                <Badge variant={
                  event.status === "approved" ? "default" :
                  event.status === "completed" ? "secondary" :
                  event.status === "pending_approval" ? "outline" :
                  "destructive"
                }>
                  {event.status.replace("_", " ")}
                </Badge>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.start_time.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
                {event.confirmed_attendees && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.confirmed_attendees} attended
                  </span>
                )}
                {photoCount > 0 && (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    {photoCount} photo{photoCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {event.regions?.name} • {event.organizer?.full_name} ({event.organizer?.email})
              </p>
              {showRejectionReason && event.rejection_reason && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{event.rejection_reason}</span>
                </div>
              )}
              {event.status === "cancelled" && event.cancellation_reason && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{event.cancellation_reason}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewEvent(event)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditEvent(event)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {showApprovalActions && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(event.id)}
                    disabled={loading === event.id}
                  >
                    {loading === event.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectEvent(event)}
                    disabled={loading === event.id}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {event.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelEvent(event)}
                  disabled={loading === event.id}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
              {(event.status !== "pending_approval") && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(event.id)}
                  disabled={loading === event.id}
                >
                  {loading === event.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
        })}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectEvent} onOpenChange={(open) => !open && setRejectEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{rejectEvent?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Rejection Reason (optional)</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this event being rejected?"
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectEvent(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading === rejectEvent?.id}
            >
              {loading === rejectEvent?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewEvent && (
        <EventDetailDialog
          event={viewEvent}
          open={!!viewEvent}
          onOpenChange={(open) => !open && setViewEvent(null)}
        />
      )}

      {/* Cancel Dialog */}
      {cancelEvent && (
        <CancelEventDialog
          event={cancelEvent}
          open={!!cancelEvent}
          onOpenChange={(open) => !open && setCancelEvent(null)}
        />
      )}

      {/* Edit Dialog */}
      {editEvent && (
        <EditEventDialog
          event={editEvent}
          regions={regions}
          open={!!editEvent}
          onOpenChange={(open) => !open && setEditEvent(null)}
        />
      )}
    </>
  );
}
