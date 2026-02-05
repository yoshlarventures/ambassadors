"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Report } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Plus, Loader2 } from "lucide-react";

interface CreateReportDialogProps {
  clubId: string;
  userId: string;
  existingReports: Report[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CreateReportDialog({ clubId, userId, existingReports }: CreateReportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Get available months (not already reported)
  const existingMonthYears = new Set(
    existingReports.map(r => `${r.month}-${r.year}`)
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = [currentYear - 1, currentYear];

  const handleCreate = async () => {
    if (!month || !year) {
      toast.error("Please select month and year");
      return;
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Check if report already exists
    if (existingMonthYears.has(`${monthNum}-${yearNum}`)) {
      toast.error("Report for this month already exists");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Calculate auto stats for this month
    const startDate = new Date(yearNum, monthNum - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];

    // Get sessions count and attendance
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, is_confirmed")
      .eq("club_id", clubId)
      .gte("session_date", startDate)
      .lte("session_date", endDate);

    const sessionsCount = sessions?.filter(s => s.is_confirmed).length || 0;

    // Get total attendance for sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: attendance } = await supabase
      .from("session_attendance")
      .select("attended")
      .in("session_id", sessionIds)
      .eq("attended", true);

    const totalAttendance = attendance?.length || 0;

    // Get events count
    const { data: events } = await supabase
      .from("events")
      .select("id, confirmed_attendees")
      .eq("organizer_id", userId)
      .eq("status", "completed")
      .gte("event_date", startDate)
      .lte("event_date", endDate);

    const eventsCount = events?.length || 0;
    const eventsAttendance = events?.reduce((sum, e) => sum + (e.confirmed_attendees || 0), 0) || 0;

    // Get new members this month
    const { data: newMembers } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("status", "approved")
      .gte("joined_at", startDate)
      .lte("joined_at", endDate);

    const newMembersCount = newMembers?.length || 0;

    // Get points earned this month
    const { data: points } = await supabase
      .from("points")
      .select("amount")
      .eq("user_id", userId)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59");

    const pointsEarned = points?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Create report
    const { error } = await supabase.from("reports").insert({
      ambassador_id: userId,
      club_id: clubId,
      month: monthNum,
      year: yearNum,
      sessions_count: sessionsCount,
      total_attendance: totalAttendance,
      events_count: eventsCount,
      events_attendance: eventsAttendance,
      new_members_count: newMembersCount,
      points_earned: pointsEarned,
      status: "draft",
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report created! Add your notes and submit for review.");
      setOpen(false);
      setMonth("");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Monthly Report</DialogTitle>
          <DialogDescription>
            Select the month and year for your report. Stats will be auto-calculated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem
                      key={i}
                      value={(i + 1).toString()}
                      disabled={
                        parseInt(year) === currentYear && i + 1 > currentMonth
                      }
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !month}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
