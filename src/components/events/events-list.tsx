"use client";

import { useState } from "react";
import { Event, User, Region } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, AlertCircle, Image as ImageIcon, Eye } from "lucide-react";
import dynamic from "next/dynamic";
const ConfirmEventDialog = dynamic(() => import("./confirm-event-dialog").then(m => ({ default: m.ConfirmEventDialog })), { ssr: false });
const EventDetailDialog = dynamic(() => import("./event-detail-dialog").then(m => ({ default: m.EventDetailDialog })), { ssr: false });

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

interface EventsListProps {
  events: EventWithRelations[];
  showConfirm?: boolean;
  showRejectionReason?: boolean;
  showApprovalActions?: boolean;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string, reason: string) => void;
}

export function EventsList({
  events,
  showConfirm,
  showRejectionReason,
}: EventsListProps) {
  const [confirmEvent, setConfirmEvent] = useState<EventWithRelations | null>(null);
  const [viewEvent, setViewEvent] = useState<EventWithRelations | null>(null);

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
                    {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                  {event.max_attendees && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Max {event.max_attendees}
                    </span>
                  )}
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
                  {event.regions?.name} • Organized by {event.organizer?.full_name}
                </p>
                {showRejectionReason && event.rejection_reason && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{event.rejection_reason}</span>
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
                {showConfirm && event.status === "approved" && (
                  <Button size="sm" onClick={() => setConfirmEvent(event)}>
                    Confirm
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmEvent && (
        <ConfirmEventDialog
          event={confirmEvent}
          open={!!confirmEvent}
          onOpenChange={(open) => !open && setConfirmEvent(null)}
        />
      )}

      {viewEvent && (
        <EventDetailDialog
          event={viewEvent}
          open={!!viewEvent}
          onOpenChange={(open) => !open && setViewEvent(null)}
        />
      )}
    </>
  );
}
