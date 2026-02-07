"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, Check, X } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ViewSessionDialogProps {
  session: Session;
  clubId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttendanceRecord {
  id: string;
  attended: boolean;
  member: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
}

export function ViewSessionDialog(props: ViewSessionDialogProps) {
  const { session, open, onOpenChange } = props;
  // clubId available via props.clubId if needed
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!open) return;

      setLoading(true);
      const supabase = createClient();

      // Fetch attendance records
      const { data: attendanceData } = await supabase
        .from("session_attendance")
        .select(`
          id,
          attended,
          member:users!session_attendance_member_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("session_id", session.id);

      // Fetch session photos
      const { data: photosData } = await supabase
        .from("club_gallery")
        .select("id, image_url, caption")
        .eq("session_id", session.id);

      setAttendance((attendanceData as unknown as AttendanceRecord[]) || []);
      setPhotos(photosData || []);
      setLoading(false);
    };

    fetchSessionDetails();
  }, [open, session.id]);

  const attendedCount = attendance.filter(a => a.attended).length;
  const totalCount = attendance.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session.title}</DialogTitle>
          <DialogDescription>
            Session details and attendance
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="space-y-2">
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
              {session.description && (
                <p className="text-sm text-muted-foreground">{session.description}</p>
              )}
              {session.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{session.notes}</p>
                </div>
              )}
            </div>

            {/* Attendance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {attendedCount}/{totalCount}
                  </span>
                  {session.attendance_rate !== null && (
                    <Badge variant={
                      session.attendance_rate >= 80 ? "default" :
                      session.attendance_rate >= 50 ? "secondary" :
                      "destructive"
                    }>
                      {session.attendance_rate}%
                    </Badge>
                  )}
                </div>
              </div>

              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {attendance.map((record) => {
                    if (!record.member) return null;
                    const initials = record.member.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.member.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{record.member.full_name}</span>
                        </div>
                        {record.attended ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            Absent
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <h4 className="font-medium">Session Photos</h4>
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo.image_url}
                        alt={photo.caption || "Session photo"}
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
