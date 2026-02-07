"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { awardRetroactiveAttendancePoints } from "@/app/actions/points";

export function RetroactivePointsButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const result = await awardRetroactiveAttendancePoints();
    setLoading(false);

    if (result.success) {
      toast.success(result.message || `Awarded points for ${result.awarded} attendance records`);
    } else {
      toast.error(result.error || "Failed to award retroactive points");
    }
  };

  return (
    <Button onClick={handleSync} disabled={loading} variant="outline" size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trophy className="mr-2 h-4 w-4" />
      )}
      Award Retroactive Points
    </Button>
  );
}
