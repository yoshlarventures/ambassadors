"use client";

import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PointEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
  users: { full_name: string } | { full_name: string }[] | null;
}

interface PointsHistoryProps {
  points: PointEntry[];
}

export function PointsHistory({ points }: PointsHistoryProps) {
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No points awarded yet. Use the form to reward your members.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {points.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-50">
              <Star className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">
                {Array.isArray(entry.users)
                  ? entry.users[0]?.full_name || "Unknown"
                  : entry.users?.full_name || "Unknown"}
              </div>
              <div className="text-sm text-muted-foreground">{entry.reason}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-purple-600 bg-purple-50">
            +{entry.amount}
          </Badge>
        </div>
      ))}
    </div>
  );
}
