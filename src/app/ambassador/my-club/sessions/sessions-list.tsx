"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, Check, Pencil, Trash2, Users, Eye } from "lucide-react";
import dynamic from "next/dynamic";
const ConfirmSessionDialog = dynamic(() => import("./confirm-session-dialog").then(m => ({ default: m.ConfirmSessionDialog })), { ssr: false });
const EditSessionDialog = dynamic(() => import("./edit-session-dialog").then(m => ({ default: m.EditSessionDialog })), { ssr: false });
const ViewSessionDialog = dynamic(() => import("./view-session-dialog").then(m => ({ default: m.ViewSessionDialog })), { ssr: false });
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SessionsListProps {
  sessions: Session[];
  clubId: string;
  showConfirm?: boolean;
  showEdit?: boolean;
}

export function SessionsList({ sessions, clubId, showConfirm, showEdit = true }: SessionsListProps) {
  const router = useRouter();
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [deleteSession, setDeleteSession] = useState<Session | null>(null);
  const [viewSession, setViewSession] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteSession) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", deleteSession.id);

      if (error) throw error;

      toast.success("Session deleted successfully");
      setDeleteSession(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No sessions found</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-start justify-between p-4 border rounded-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{session.title}</h3>
                {session.is_confirmed && (
                  <Badge variant="secondary">
                    <Check className="mr-1 h-3 w-3" />
                    Confirmed
                  </Badge>
                )}
                {session.is_confirmed && session.attendance_rate !== null && (
                  <Badge variant={
                    session.attendance_rate >= 80 ? "default" :
                    session.attendance_rate >= 50 ? "secondary" :
                    "destructive"
                  }>
                    <Users className="mr-1 h-3 w-3" />
                    {session.attendance_rate}%
                  </Badge>
                )}
              </div>
              {session.description && (
                <p className="text-sm text-muted-foreground">{session.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(session.session_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.start_time.slice(0, 5)}
                  {session.end_time && ` - ${session.end_time.slice(0, 5)}`}
                </span>
                {session.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {session.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {session.is_confirmed && (
                <Button size="sm" variant="outline" onClick={() => setViewSession(session)}>
                  <Eye className="mr-1 h-4 w-4" />
                  View Details
                </Button>
              )}
              {showEdit && !session.is_confirmed && (
                <Button size="sm" variant="outline" onClick={() => setEditSession(session)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
              {showConfirm && !session.is_confirmed && (
                <Button size="sm" onClick={() => setConfirmSession(session)}>
                  Confirm
                </Button>
              )}
              {!session.is_confirmed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteSession(session)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmSession && (
        <ConfirmSessionDialog
          session={confirmSession}
          clubId={clubId}
          open={!!confirmSession}
          onOpenChange={(open) => !open && setConfirmSession(null)}
        />
      )}

      {editSession && (
        <EditSessionDialog
          session={editSession}
          open={!!editSession}
          onOpenChange={(open) => !open && setEditSession(null)}
        />
      )}

      {viewSession && (
        <ViewSessionDialog
          session={viewSession}
          clubId={clubId}
          open={!!viewSession}
          onOpenChange={(open) => !open && setViewSession(null)}
        />
      )}

      <AlertDialog open={!!deleteSession} onOpenChange={(open) => !open && setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteSession?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
