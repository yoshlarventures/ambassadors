"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, AlertCircle, Image as ImageIcon, Eye } from "lucide-react";
import { Event, Region, User } from "@/types";
import { ConfirmEventDialog } from "./confirm-event-dialog";
import { EventDetailDialog } from "./event-detail-dialog";

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user_id: string; user?: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

interface OrganizerEventsSectionProps {
  events: EventWithRelations[];
  userId: string;
  title?: string;
}

function EventItem({
  event,
  showConfirm,
  showRejectionReason,
  showCancellationReason,
  onConfirm,
  onView,
}: {
  event: EventWithRelations;
  showConfirm?: boolean;
  showRejectionReason?: boolean;
  showCancellationReason?: boolean;
  onConfirm?: () => void;
  onView?: () => void;
}) {
  const photoCount = event.event_photos?.length || 0;

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between p-4 border rounded-lg gap-4">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium">{event.title}</h3>
          <Badge
            variant={
              event.status === "approved"
                ? "default"
                : event.status === "completed"
                ? "secondary"
                : event.status === "pending_approval"
                ? "outline"
                : "destructive"
            }
          >
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
        {showCancellationReason && event.cancellation_reason && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{event.cancellation_reason}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={onView}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {showConfirm && onConfirm && (
          <Button size="sm" onClick={onConfirm}>
            Confirm
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrganizerEventsSection(props: OrganizerEventsSectionProps) {
  const { events, title = "My Events" } = props;
  // userId available via props.userId if needed
  const router = useRouter();
  const [confirmEvent, setConfirmEvent] = useState<EventWithRelations | null>(null);
  const [viewEvent, setViewEvent] = useState<EventWithRelations | null>(null);

  const now = new Date();
  // Use local date components, not toISOString() which gives UTC
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" in local time

  // Helper to check if event has started
  const hasEventStarted = (event: EventWithRelations) => {
    const eventTime = event.start_time.slice(0, 5);
    if (event.event_date < today) return true;
    if (event.event_date === today && eventTime <= currentTime) return true;
    return false;
  };

  // Filter events into 3 consolidated groups
  // Active = Pending + Approved (not started + needs confirmation)
  const activeEvents = events
    .filter((e) =>
      e.status === "pending_approval" ||
      (e.status === "approved")
    )
    .sort((a, b) => {
      // Sort: needs confirmation first, then by date
      const aStarted = hasEventStarted(a);
      const bStarted = hasEventStarted(b);
      if (aStarted && !bStarted) return -1;
      if (!aStarted && bStarted) return 1;
      // Then pending before approved
      if (a.status === "pending_approval" && b.status !== "pending_approval") return -1;
      if (a.status !== "pending_approval" && b.status === "pending_approval") return 1;
      return a.event_date.localeCompare(b.event_date);
    });

  const completed = events.filter((e) => e.status === "completed");

  // Archived = Rejected + Cancelled
  const archived = events.filter(
    (e) => e.status === "rejected" || e.status === "cancelled"
  );

  const handleConfirmComplete = () => {
    setConfirmEvent(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeEvents.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Events</CardTitle>
            </CardHeader>
            <CardContent>
              {activeEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active events</p>
              ) : (
                <div className="space-y-4">
                  {activeEvents.map((event) => {
                    const needsConfirm = event.status === "approved" && hasEventStarted(event);
                    return (
                      <EventItem
                        key={event.id}
                        event={event}
                        showConfirm={needsConfirm}
                        onConfirm={needsConfirm ? () => setConfirmEvent(event) : undefined}
                        onView={() => setViewEvent(event)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Events</CardTitle>
            </CardHeader>
            <CardContent>
              {completed.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No completed events</p>
              ) : (
                <div className="space-y-4">
                  {completed.map((event) => (
                    <EventItem key={event.id} event={event} onView={() => setViewEvent(event)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Events</CardTitle>
            </CardHeader>
            <CardContent>
              {archived.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No archived events</p>
              ) : (
                <div className="space-y-4">
                  {archived.map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      showRejectionReason={event.status === "rejected"}
                      showCancellationReason={event.status === "cancelled"}
                      onView={() => setViewEvent(event)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {confirmEvent && (
        <ConfirmEventDialog
          event={confirmEvent}
          open={!!confirmEvent}
          onOpenChange={(open) => !open && setConfirmEvent(null)}
          onComplete={handleConfirmComplete}
        />
      )}

      {viewEvent && (
        <EventDetailDialog
          event={viewEvent}
          open={!!viewEvent}
          onOpenChange={(open) => !open && setViewEvent(null)}
        />
      )}
    </div>
  );
}
