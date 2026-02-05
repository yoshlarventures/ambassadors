"use client";

import { useState } from "react";
import { Session } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Eye } from "lucide-react";
import { ViewSessionDialog } from "@/app/ambassador/my-club/sessions/view-session-dialog";

interface LeadSessionsListProps {
  sessions: Session[];
  clubId: string;
  showViewDetails?: boolean;
}

export function LeadSessionsList({ sessions, clubId, showViewDetails }: LeadSessionsListProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setViewDialogOpen(true);
  };

  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No sessions</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{session.title}</h3>
              <div className="flex items-center gap-2">
                {session.is_confirmed && session.attendance_rate !== null && (
                  <Badge variant={session.attendance_rate >= 80 ? "default" : session.attendance_rate >= 50 ? "secondary" : "destructive"}>
                    {session.attendance_rate}% attendance
                  </Badge>
                )}
                {showViewDetails && session.is_confirmed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(session)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {new Date(session.session_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.start_time.slice(0, 5)}
                {session.end_time && ` - ${session.end_time.slice(0, 5)}`}
              </div>
              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              )}
            </div>

            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
          </div>
        ))}
      </div>

      {selectedSession && (
        <ViewSessionDialog
          session={selectedSession}
          clubId={clubId}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}
    </>
  );
}
