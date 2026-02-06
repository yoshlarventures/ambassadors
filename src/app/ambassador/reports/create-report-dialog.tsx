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
  clubIds: string[];
  userId: string;
  existingReports: Report[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CreateReportDialog({ clubIds, userId, existingReports }: CreateReportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Get available months (not already reported)
  const existingMonthYears = new Set(
    existingReports.map(r => `${r.month}-${r.year}`)
  );

  // Track which months have rejected reports (need to edit instead of create new)
  const rejectedMonthYears = new Set(
    existingReports
      .filter(r => r.status === "rejected")
      .map(r => `${r.month}-${r.year}`)
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
      if (rejectedMonthYears.has(`${monthNum}-${yearNum}`)) {
        toast.error("A rejected report exists for this month. Please edit and resubmit it from the Rejected tab.");
      } else {
        toast.error("Report for this month already exists");
      }
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Calculate auto stats for this month
    const startDate = new Date(yearNum, monthNum - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];

    // Get sessions with full data for snapshot
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, title, session_date, is_confirmed, attendance_rate")
      .in("club_id", clubIds)
      .gte("session_date", startDate)
      .lte("session_date", endDate);

    const confirmedSessions = sessions?.filter(s => s.is_confirmed) || [];
    const sessionsCount = confirmedSessions.length;
    const sessionIds = confirmedSessions.map(s => s.id);

    // Calculate average attendance rate from confirmed sessions with non-null rates
    const sessionsWithRate = confirmedSessions.filter(s => s.attendance_rate != null);
    const attendanceRate = sessionsWithRate.length > 0
      ? Math.round(sessionsWithRate.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / sessionsWithRate.length)
      : null;

    // Get attendance counts for each session
    const { data: attendanceCounts } = await supabase
      .from("session_attendance")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("attended", true);

    const attendanceCountMap = new Map<string, number>();
    attendanceCounts?.forEach(a => {
      attendanceCountMap.set(a.session_id, (attendanceCountMap.get(a.session_id) || 0) + 1);
    });

    const totalAttendance = attendanceCounts?.length || 0;

    // Create sessions snapshot data
    const sessionsData = confirmedSessions.map(s => ({
      id: s.id,
      title: s.title,
      session_date: s.session_date,
      attendance_count: attendanceCountMap.get(s.id) || 0,
      attendance_rate: s.attendance_rate,
    }));

    // Get events with full data for snapshot
    const { data: events } = await supabase
      .from("events")
      .select("id, title, event_date, location, confirmed_attendees")
      .eq("organizer_id", userId)
      .eq("status", "completed")
      .gte("event_date", startDate)
      .lte("event_date", endDate);

    const eventsCount = events?.length || 0;
    const eventsAttendance = events?.reduce((sum, e) => sum + (e.confirmed_attendees || 0), 0) || 0;
    const eventIds = events?.map(e => e.id) || [];

    // Create events snapshot data
    const eventsData = events?.map(e => ({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      location: e.location,
      confirmed_attendees: e.confirmed_attendees,
    })) || [];

    // Get new members with user info for snapshot
    const { data: newMembers } = await supabase
      .from("club_members")
      .select("id, joined_at, user:users!club_members_user_id_fkey(full_name, email)")
      .in("club_id", clubIds)
      .eq("status", "approved")
      .gte("joined_at", startDate + "T00:00:00")
      .lte("joined_at", endDate + "T23:59:59");

    const newMembersCount = newMembers?.length || 0;
    const memberIds = newMembers?.map(m => m.id) || [];

    // Create members snapshot data
    const membersData = newMembers?.map(m => {
      // user is a single object since club_members has FK to users
      const user = m.user as unknown as { full_name: string; email: string } | null;
      return {
        id: m.id,
        user_name: user?.full_name || "Unknown",
        user_email: user?.email || "",
        joined_at: m.joined_at,
      };
    }) || [];

    // Get points with full data for snapshot
    const { data: points } = await supabase
      .from("points")
      .select("id, amount, reason, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate + "T00:00:00")
      .lte("created_at", endDate + "T23:59:59");

    const pointsEarned = points?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const pointIds = points?.map(p => p.id) || [];

    // Create points snapshot data
    const pointsData = points?.map(p => ({
      id: p.id,
      amount: p.amount,
      reason: p.reason,
      created_at: p.created_at,
    })) || [];

    // Create report with snapshot data (use first club as primary for FK constraint)
    const { error } = await supabase.from("reports").insert({
      ambassador_id: userId,
      club_id: clubIds[0],
      month: monthNum,
      year: yearNum,
      sessions_count: sessionsCount,
      total_attendance: totalAttendance,
      events_count: eventsCount,
      events_attendance: eventsAttendance,
      new_members_count: newMembersCount,
      points_earned: pointsEarned,
      attendance_rate: attendanceRate,
      session_ids: sessionIds.length > 0 ? sessionIds : null,
      event_ids: eventIds.length > 0 ? eventIds : null,
      member_ids: memberIds.length > 0 ? memberIds : null,
      point_ids: pointIds.length > 0 ? pointIds : null,
      sessions_data: sessionsData.length > 0 ? sessionsData : null,
      events_data: eventsData.length > 0 ? eventsData : null,
      members_data: membersData.length > 0 ? membersData : null,
      points_data: pointsData.length > 0 ? pointsData : null,
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
