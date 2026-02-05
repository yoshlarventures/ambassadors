"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Region } from "@/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export interface AmbassadorOption {
  id: string;
  full_name: string;
  email: string;
  region_id: string | null;
  has_club: boolean;
}

interface CreateClubDialogProps {
  regions: Region[];
  ambassadors: AmbassadorOption[];
  userRole: "admin" | "regional_leader";
  userRegionId?: string | null;
}

export function CreateClubDialog({
  regions,
  ambassadors,
  userRole,
  userRegionId,
}: CreateClubDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [selectedAmbassadorIds, setSelectedAmbassadorIds] = useState<string[]>([]);
  const [regionId, setRegionId] = useState(
    userRole === "regional_leader" && userRegionId ? userRegionId : ""
  );
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => {
    setName("");
    setSelectedAmbassadorIds([]);
    setRegionId(userRole === "regional_leader" && userRegionId ? userRegionId : "");
    setDescription("");
    setAddress("");
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
      const response = await fetch("/api/clubs", {
        method: "POST",
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
        toast.error(data.error || "Failed to create club");
        return;
      }

      toast.success("Club created successfully");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Error creating club:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>
              Create a startup club and assign ambassadors.
              {userRole === "regional_leader" &&
                " The club will be created in your region."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Club Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
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
                    // Reset ambassador selection when region changes
                    setSelectedAmbassadorIds([]);
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
              {userRole === "admin" && !regionId ? (
                <p className="text-sm text-muted-foreground py-2">
                  Select a region first to see available ambassadors.
                </p>
              ) : availableAmbassadors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No available ambassadors in this region.
                </p>
              ) : (
                <ScrollArea className="h-[150px] rounded-md border p-2">
                  <div className="space-y-2">
                    {availableAmbassadors.map((amb) => (
                      <label
                        key={amb.id}
                        htmlFor={`amb-${amb.id}`}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          id={`amb-${amb.id}`}
                          checked={selectedAmbassadorIds.includes(amb.id)}
                          onCheckedChange={() => toggleAmbassador(amb.id)}
                          disabled={loading}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {amb.full_name}
                          </span>
                          <p className="text-xs text-muted-foreground truncate">
                            {amb.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the club"
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
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
              Create Club
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
