"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Event, User, Region, EventLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User as UserIcon,
  AlertCircle,
  Image as ImageIcon,
  History,
  Loader2,
} from "lucide-react";

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user_id?: string; user?: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

type EventLogWithActor = EventLog & {
  actor: Pick<User, "full_name"> | null;
};

interface EventDetailDialogProps {
  event: EventWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActivityLog?: boolean;
}

const actionLabels: Record<string, string> = {
  created: "Created",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  confirmed: "Confirmed",
  edited: "Edited",
};

const statusColors: Record<string, string> = {
  pending_approval: "outline",
  approved: "default",
  rejected: "destructive",
  completed: "secondary",
  cancelled: "destructive",
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  showActivityLog = true,
}: EventDetailDialogProps) {
  const [logs, setLogs] = useState<EventLogWithActor[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (open && showActivityLog) {
      fetchLogs();
    }
  }, [open, event.id, showActivityLog]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("event_logs")
      .select(`
        *,
        actor:users!event_logs_actor_id_fkey(full_name)
      `)
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    setLogs((data as EventLogWithActor[]) || []);
    setLoadingLogs(false);
  };

  const collaborators = event.event_collaborators
    ?.filter((c) => c.user)
    .map((c) => c.user!.full_name) || [];

  const photoCount = event.event_photos?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Cover image hero */}
        {event.cover_image_url ? (
          <div className="relative h-48 w-full">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4 pt-12">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl text-foreground">{event.title}</DialogTitle>
                <Badge variant={statusColors[event.status] as "default" | "secondary" | "destructive" | "outline"}>
                  {event.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <Badge variant={statusColors[event.status] as "default" | "secondary" | "destructive" | "outline"}>
                {event.status.replace("_", " ")}
              </Badge>
            </div>
          </DialogHeader>
        )}

        <div className="space-y-6 px-6 pb-6">
          {/* Event Details */}
          <div className="space-y-3">
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.start_time.slice(0, 5)}
                  {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.regions?.name}</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Organizer:</strong> {event.organizer?.full_name}
                </span>
              </div>
              {collaborators.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>Collaborators:</strong> {collaborators.join(", ")}
                  </span>
                </div>
              )}
              {event.max_attendees && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>Max Attendees:</strong> {event.max_attendees}
                  </span>
                </div>
              )}
              {event.confirmed_attendees && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>Confirmed Attendees:</strong> {event.confirmed_attendees}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rejection/Cancellation Reason */}
          {event.status === "rejected" && event.rejection_reason && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Rejection Reason:</strong>
                <p>{event.rejection_reason}</p>
              </div>
            </div>
          )}

          {event.status === "cancelled" && event.cancellation_reason && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Cancellation Reason:</strong>
                <p>{event.cancellation_reason}</p>
              </div>
            </div>
          )}

          {/* Photos */}
          {photoCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Photos ({photoCount})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {event.event_photos?.slice(0, 9).map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.image_url}
                    alt="Event photo"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {showActivityLog && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activity History
                </h4>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity logs yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {logs.map((log) => {
                      const details = log.details as Record<string, unknown> | null;
                      return (
                        <div
                          key={log.id}
                          className="text-sm p-3 rounded-lg bg-muted/50 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-medium">{log.actor?.full_name}</span>
                              {" "}
                              <span className="text-muted-foreground">
                                {actionLabels[log.action] || log.action}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          {details && (
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-1 pl-2 border-l-2 border-muted">
                              {"reason" in details && details.reason ? (
                                <p><strong>Reason:</strong> {String(details.reason)}</p>
                              ) : null}
                              {"confirmed_attendees" in details && details.confirmed_attendees ? (
                                <p><strong>Attendees:</strong> {String(details.confirmed_attendees)}</p>
                              ) : null}
                              {"photos_uploaded" in details ? (
                                <p><strong>Photos:</strong> {String(details.photos_uploaded)} uploaded</p>
                              ) : null}
                              {"notes" in details && details.notes ? (
                                <p><strong>Notes:</strong> {String(details.notes)}</p>
                              ) : null}
                              {"fields_changed" in details && details.fields_changed ? (
                                <p><strong>Changed:</strong> {(details.fields_changed as string[]).join(", ")}</p>
                              ) : null}
                              {log.action === "created" && "event_date" in details && details.event_date ? (
                                <p><strong>Date:</strong> {String(details.event_date)} at {String(details.start_time)}</p>
                              ) : null}
                              {log.action === "created" && "location" in details && details.location ? (
                                <p><strong>Location:</strong> {String(details.location)}</p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
