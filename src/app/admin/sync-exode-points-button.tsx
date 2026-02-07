"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function SyncExodePointsButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/exode/sync-points", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync points");
      }

      toast.success(data.message, {
        description: `Updated ${data.updated} users${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
      });
    } catch (error) {
      toast.error("Sync failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
    >
      {isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <GraduationCap className="h-4 w-4" />
      )}
      {isSyncing ? "Syncing..." : "Sync Exode Course Points"}
    </Button>
  );
}
