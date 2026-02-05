"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Club, Region } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Loader2, History, Trash2 } from "lucide-react";
import { AmbassadorOption } from "./create-club-dialog";
import { ClubHistoryDialog } from "./club-history-dialog";
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

interface ClubAmbassadorInfo {
  id: string;
  ambassador_id: string;
  ambassador?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface ClubWithAmbassadors extends Club {
  club_ambassadors?: ClubAmbassadorInfo[];
}

interface ClubActionsProps {
  club: ClubWithAmbassadors;
  regions: Region[];
  ambassadors: AmbassadorOption[];
  userRole: "admin" | "regional_leader";
  userRegionId?: string | null;
}

export function ClubActions({
  club,
  regions,
  ambassadors,
  userRole,
  userRegionId,
}: ClubActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get current ambassador IDs from club
  const currentAmbassadorIds = (club.club_ambassadors || []).map(
    (ca) => ca.ambassador_id
  );

  // Form state
  const [name, setName] = useState(club.name);
  const [selectedAmbassadorIds, setSelectedAmbassadorIds] = useState<string[]>(currentAmbassadorIds);
  const [regionId, setRegionId] = useState(club.region_id);
  const [description, setDescription] = useState(club.description || "");
  const [address, setAddress] = useState(club.address || "");

  const resetForm = () => {
    setName(club.name);
    setSelectedAmbassadorIds(currentAmbassadorIds);
    setRegionId(club.region_id);
    setDescription(club.description || "");
    setAddress(club.address || "");
  };

  // Filter ambassadors based on role and selected region
  const availableAmbassadors = ambassadors.filter((amb) => {
    // For regional leaders, only show ambassadors in their region
    if (userRole === "regional_leader") {
      return amb.region_id === userRegionId;
    }

    // For admin, filter by selected region if one is selected
    if (regionId) {
      return amb.region_id === regionId;
    }

    return true;
  });

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/clubs/${club.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete club");
        return;
      }

      toast.success("Club deleted successfully");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting club:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const toggleAmbassador = (ambassadorId: string) => {
    setSelectedAmbassadorIds((prev) =>
      prev.includes(ambassadorId)
        ? prev.filter((id) => id !== ambassadorId)
        : [...prev, ambassadorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!name.trim()) {
      toast.error("Club name is required");
      return;
    }
    if (selectedAmbassadorIds.length === 0) {
      toast.error("Please select at least one ambassador");
      return;
    }
    if (!regionId) {
      toast.error("Please select a region");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          ambassador_ids: selectedAmbassadorIds,
          region_id: regionId,
          description: description.trim() || null,
          address: address.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update club");
        return;
      }

      toast.success("Club updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating club:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Club
          </DropdownMenuItem>
          {userRole === "admin" && (
            <>
              <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Club
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Club</DialogTitle>
              <DialogDescription>
                Update the club details for {club.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Club Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter club name"
                  disabled={loading}
                />
              </div>

              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label>
                    Region <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={regionId}
                    onValueChange={(value) => {
                      setRegionId(value);
                      // Keep only ambassadors that are still valid for the new region
                      const validIds = ambassadors
                        .filter((a) => a.region_id === value || currentAmbassadorIds.includes(a.id))
                        .map((a) => a.id);
                      setSelectedAmbassadorIds((prev) =>
                        prev.filter((id) => validIds.includes(id))
                      );
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Ambassadors <span className="text-destructive">*</span>
                  {selectedAmbassadorIds.length > 0 && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({selectedAmbassadorIds.length} selected)
                    </span>
                  )}
                </Label>
                {availableAmbassadors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No available ambassadors.
                  </p>
                ) : (
                  <ScrollArea className="h-[150px] rounded-md border p-2">
                    <div className="space-y-2">
                      {availableAmbassadors.map((amb) => {
                        const isCurrent = currentAmbassadorIds.includes(amb.id);
                        return (
                          <label
                            key={amb.id}
                            htmlFor={`edit-amb-${amb.id}`}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              id={`edit-amb-${amb.id}`}
                              checked={selectedAmbassadorIds.includes(amb.id)}
                              onCheckedChange={() => toggleAmbassador(amb.id)}
                              disabled={loading}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">
                                {amb.full_name}
                                {isCurrent && (
                                  <span className="ml-1 text-muted-foreground">
                                    (current)
                                  </span>
                                )}
                              </span>
                              <p className="text-xs text-muted-foreground truncate">
                                {amb.email}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the club"
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Club meeting location"
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {userRole === "admin" && (
        <>
          <ClubHistoryDialog
            clubId={club.id}
            clubName={club.name}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
          />

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Club</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{club.name}&quot;? This action cannot be undone.
                  All club members, sessions, and related data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
