"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ImageIcon, X, Plus } from "lucide-react";
import { awardAttendancePoints } from "@/app/actions/points";

interface ConfirmSessionDialogProps {
  session: Session;
  clubId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoFile {
  file: File;
  preview: string;
}

export function ConfirmSessionDialog({
  session,
  clubId,
  open,
  onOpenChange,
}: ConfirmSessionDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<(User & { memberId: string })[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("club_members")
        .select("id, users!club_members_user_id_fkey(id, full_name, email)")
        .eq("club_id", clubId)
        .eq("status", "approved");

      if (data) {
        const membersList = data
          .filter(m => m.users)
          .map(m => ({
            ...(m.users as unknown as User),
            memberId: m.id,
          }));
        setMembers(membersList);
        // Initialize all as attended
        const initialAttendance: Record<string, boolean> = {};
        membersList.forEach(m => {
          initialAttendance[m.id] = true;
        });
        setAttendance(initialAttendance);
      }
    };

    if (open) {
      fetchMembers();
    }
  }, [open, clubId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToAdd) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select image files only");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per image.`);
        continue;
      }

      setPhotos(prev => [
        ...prev,
        { file, preview: URL.createObjectURL(file) }
      ]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleConfirm = async () => {
    if (photos.length === 0) {
      toast.error("Please upload at least 1 photo from the session");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Upload photos first
      const uploadedUrls: string[] = [];

      for (const photo of photos) {
        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${session.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `sessions/${clubId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("session-photos")
          .upload(filePath, photo.file);

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("session-photos")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Add photos to club gallery
      const galleryRecords = uploadedUrls.map(url => ({
        club_id: clubId,
        image_url: url,
        session_id: session.id,
        caption: `Session: ${session.title}`,
      }));

      const { error: galleryError } = await supabase
        .from("club_gallery")
        .insert(galleryRecords);

      if (galleryError) {
        console.error("Gallery error:", galleryError);
        // Don't fail the whole operation for gallery errors
      }

      // Calculate final attendance rate
      const finalAttendanceRate = members.length > 0
        ? Math.round((attendedCount / members.length) * 100)
        : 0;

      // Update session as confirmed with attendance rate
      const { error: sessionError } = await supabase
        .from("sessions")
        .update({
          is_confirmed: true,
          notes: notes || null,
          attendance_rate: finalAttendanceRate,
        })
        .eq("id", session.id);

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      // Create attendance records
      const attendanceRecords = members.map(member => ({
        session_id: session.id,
        member_id: member.id,
        attended: attendance[member.id] ?? false,
      }));

      if (attendanceRecords.length > 0) {
        const { error: attendanceError } = await supabase
          .from("session_attendance")
          .insert(attendanceRecords);

        if (attendanceError && attendanceError.code !== "23505") {
          console.error("Attendance error:", attendanceError);
        }
      }

      // Award points to attending members
      const attendingMemberIds = members.filter(m => attendance[m.id]).map(m => m.id);
      if (attendingMemberIds.length > 0) {
        await awardAttendancePoints(attendingMemberIds, session.id, session.title, session.session_date);
      }

      toast.success("Session confirmed successfully!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm session");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (userId: string) => {
    setAttendance(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Cleanup previews
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setNotes("");
    }
    onOpenChange(isOpen);
  };

  const attendedCount = Object.values(attendance).filter(Boolean).length;
  const attendanceRate = members.length > 0
    ? Math.round((attendedCount / members.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Session</DialogTitle>
          <DialogDescription>
            Confirm &quot;{session.title}&quot; and mark attendance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Photos - Required */}
          <div className="space-y-2">
            <Label>
              Session Photos <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload 1-3 photos from the session
            </p>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.preview}
                    alt={`Session photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {photos.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {photos.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload photos</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each</p>
              </div>
            )}
          </div>

          {/* Attendance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Attendance ({attendedCount}/{members.length}) <span className="text-destructive">*</span>
              </Label>
              {members.length > 0 && (
                <span className={`text-sm font-semibold ${
                  attendanceRate >= 80 ? "text-green-600" :
                  attendanceRate >= 50 ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {attendanceRate}% attendance
                </span>
              )}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No club members yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                  >
                    <Checkbox
                      id={member.id}
                      checked={attendance[member.id] ?? false}
                      onCheckedChange={() => toggleAttendance(member.id)}
                    />
                    <label
                      htmlFor={member.id}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {member.full_name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this session..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || photos.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
