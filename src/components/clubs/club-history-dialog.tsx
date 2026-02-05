"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, History } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_name: string;
}

interface ClubHistoryDialogProps {
  clubId: string;
  clubName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClubHistoryDialog({
  clubId,
  clubName,
  open,
  onOpenChange,
}: ClubHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("club_activity_log")
      .select(`
        id,
        action,
        details,
        created_at,
        user_id
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      setLoading(false);
      return;
    }

    // Fetch user names separately
    const userIds = Array.from(new Set((data || []).map((d) => d.user_id)));
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u) => [u.id, u.full_name]));

    const logsWithNames: ActivityLog[] = (data || []).map((d) => ({
      id: d.id,
      action: d.action,
      details: d.details as Record<string, unknown>,
      created_at: d.created_at,
      user_name: userMap.get(d.user_id) || "Unknown",
    }));

    setLogs(logsWithNames);
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  const formatAction = (action: string) => {
    switch (action) {
      case "created":
        return "Created club";
      case "updated":
        return "Updated club";
      case "ambassador_added":
        return "Added ambassador";
      case "ambassador_removed":
        return "Removed ambassador";
      default:
        return action;
    }
  };

  const formatDetails = (action: string, details: Record<string, unknown>) => {
    if (action === "created") {
      return `Name: "${details.name}"`;
    }

    if (action === "updated") {
      const changes: string[] = [];
      for (const [key, value] of Object.entries(details)) {
        if (key === "ambassadors") {
          changes.push("Changed ambassadors");
        } else if (typeof value === "object" && value !== null && "from" in value && "to" in value) {
          const { from, to } = value as { from: unknown; to: unknown };
          changes.push(`${key}: "${from || "(empty)"}" → "${to || "(empty)"}"`);
        }
      }
      return changes.join(", ");
    }

    return JSON.stringify(details);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity History
          </DialogTitle>
          <DialogDescription>
            History of changes for {clubName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No activity history found.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border-l-2 border-muted pl-4 pb-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{formatAction(log.action)}</p>
                      <p className="text-sm text-muted-foreground">
                        by {log.user_name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm mt-1">
                    {formatDetails(log.action, log.details)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
