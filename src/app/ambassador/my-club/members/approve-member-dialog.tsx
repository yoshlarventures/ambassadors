"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ApproveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    users: Pick<User, "id" | "full_name" | "email" | "avatar_url"> | null;
  };
  clubId: string;
  approverId: string;
}

export function ApproveMemberDialog({
  open,
  onOpenChange,
  member,
  approverId,
}: ApproveMemberDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const user = member.users;
  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please upload a screenshot of your conversation with the member");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Upload the screenshot
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${member.id}-${Date.now()}.${fileExt}`;
      const filePath = `approvals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("member-approvals")
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("member-approvals")
        .getPublicUrl(filePath);

      // Update the member record
      const { error: updateError } = await supabase
        .from("club_members")
        .update({
          status: "approved",
          joined_at: new Date().toISOString(),
          approval_screenshot_url: urlData.publicUrl,
          approval_notes: notes || null,
          approved_by: approverId,
        })
        .eq("id", member.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success("Member approved successfully!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      handleRemoveFile();
      setNotes("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Approve Member</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your conversation with the member before approving their request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.full_name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>
              Conversation Screenshot <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload a screenshot showing your conversation with this member
            </p>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload screenshot</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this member..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Approve Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
