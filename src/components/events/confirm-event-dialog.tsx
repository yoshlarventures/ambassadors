"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";
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
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface ConfirmEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ConfirmEventDialog({
  event,
  open,
  onOpenChange,
  onComplete,
}: ConfirmEventDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter for valid image files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    // Check if adding these would exceed the limit
    const remainingSlots = MAX_PHOTOS - photos.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      toast.error(`You can only upload ${MAX_PHOTOS} photos maximum`);
    }

    // Create preview URLs
    const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file));

    setPhotos((prev) => [...prev, ...filesToAdd]);
    setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);

    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (supabase: ReturnType<typeof createClient>, eventId: string) => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-photos")
        .upload(fileName, photo);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("event-photos")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleConfirm = async () => {
    if (!attendeesCount) {
      toast.error("Please enter the number of attendees");
      return;
    }

    if (photos.length < MIN_PHOTOS) {
      toast.error(`Please upload at least ${MIN_PHOTOS} photos`);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Upload photos if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(supabase, event.id);
      }

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({
          status: "completed",
          confirmed_attendees: parseInt(attendeesCount),
        })
        .eq("id", event.id);

      if (updateError) {
        throw updateError;
      }

      // Insert photo records if any were uploaded
      if (photoUrls.length > 0) {
        const photoRecords = photoUrls.map((url) => ({
          event_id: event.id,
          image_url: url,
        }));

        const { error: photoError } = await supabase
          .from("event_photos")
          .insert(photoRecords);

        if (photoError) {
          console.error("Error saving photo records:", photoError);
          // Don't throw - event is already confirmed
        }
      }

      // Log the action with details
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("event_logs").insert({
          event_id: event.id,
          action: "confirmed",
          actor_id: user.id,
          details: {
            event_title: event.title,
            event_date: event.event_date,
            confirmed_attendees: parseInt(attendeesCount),
            photos_uploaded: photoUrls.length,
            notes: notes || null,
          },
        });
      }

      toast.success("Event confirmed successfully!");

      // Cleanup preview URLs
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));

      // Reset state
      setAttendeesCount("");
      setNotes("");
      setPhotos([]);
      setPhotoPreviewUrls([]);

      onOpenChange(false);
      onComplete?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm event");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Cleanup preview URLs when closing
    photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAttendeesCount("");
    setNotes("");
    setPhotos([]);
    setPhotoPreviewUrls([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Event</DialogTitle>
          <DialogDescription>
            Confirm &quot;{event.title}&quot; as completed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="attendeesCount">Number of Attendees *</Label>
            <Input
              id="attendeesCount"
              type="number"
              value={attendeesCount}
              onChange={(e) => setAttendeesCount(e.target.value)}
              placeholder="How many people attended?"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the event go? Any highlights?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photos * (min {MIN_PHOTOS}, max {MAX_PHOTOS})</Label>
            <div className="space-y-3">
              {/* Photo previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {photos.length < MAX_PHOTOS && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {photos.length === 0 ? "Upload Photos" : "Add More Photos"}
                    <span className="ml-2 text-muted-foreground">
                      ({photos.length}/{MAX_PHOTOS})
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !attendeesCount || photos.length < MIN_PHOTOS}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
