"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Report, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Calendar,
  UserPlus,
  FileText,
  Trophy,
  Send,
  Pencil,
  AlertCircle,
  Loader2,
  Percent,
  Trash2,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type ReportWithReviewer = Report & {
  reviewer: Pick<User, "full_name"> | null;
};

type DetailType = "sessions" | "events" | "members" | "points";

interface DetailData {
  type: DetailType;
  report: ReportWithReviewer;
}

interface ReportsListProps {
  reports: ReportWithReviewer[];
  showEdit?: boolean;
  showRejectionReason?: boolean;
}

export function ReportsList({ reports, showEdit, showRejectionReason }: ReportsListProps) {
  const router = useRouter();
  const [editReport, setEditReport] = useState<ReportWithReviewer | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState("");
  const [challenges, setChallenges] = useState("");
  const [goals, setGoals] = useState("");

  // Detail dialog state - uses stored snapshot data (no loading needed)
  const [detailData, setDetailData] = useState<DetailData | null>(null);

  // Delete confirmation state
  const [deleteReport, setDeleteReport] = useState<ReportWithReviewer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (report: ReportWithReviewer) => {
    setEditReport(report);
    setHighlights(report.highlights || "");
    setChallenges(report.challenges || "");
    setGoals(report.goals || "");
  };

  const handleSave = async () => {
    if (!editReport) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        highlights: highlights || null,
        challenges: challenges || null,
        goals: goals || null,
      })
      .eq("id", editReport.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report updated!");
      setEditReport(null);
      router.refresh();
    }

    setLoading(false);
  };

  const handleSubmit = async (reportId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report submitted for review!");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteReport) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", deleteReport.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report deleted!");
      setDeleteReport(null);
      router.refresh();
    }

    setDeleteLoading(false);
  };

  // Uses stored snapshot data - no database fetching needed
  const handleMetricClick = (type: DetailType, report: ReportWithReviewer) => {
    setDetailData({ type, report });
  };

  if (reports.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No reports found</p>;
  }

  const getDetailTitle = () => {
    if (!detailData) return "";
    const monthYear = `${MONTHS[detailData.report.month - 1]} ${detailData.report.year}`;
    switch (detailData.type) {
      case "sessions": return `Sessions - ${monthYear}`;
      case "events": return `Events - ${monthYear}`;
      case "members": return `New Members - ${monthYear}`;
      case "points": return `Points Earned - ${monthYear}`;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col md:flex-row md:items-start justify-between p-4 border rounded-lg gap-4"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {MONTHS[report.month - 1]} {report.year}
                </h3>
                <Badge variant={
                  report.status === "approved" ? "default" :
                  report.status === "submitted" ? "outline" :
                  report.status === "rejected" ? "destructive" :
                  "secondary"
                }>
                  {report.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <button
                  onClick={() => handleMetricClick("sessions", report)}
                  className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{report.sessions_count} sessions</span>
                </button>
                <button
                  onClick={() => handleMetricClick("sessions", report)}
                  className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                >
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span>{report.attendance_rate != null ? `${report.attendance_rate}%` : "N/A"}</span>
                </button>
                <button
                  onClick={() => handleMetricClick("events", report)}
                  className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{report.events_count} events</span>
                </button>
                <button
                  onClick={() => handleMetricClick("members", report)}
                  className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                >
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span>{report.new_members_count} new</span>
                </button>
                <button
                  onClick={() => handleMetricClick("points", report)}
                  className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                >
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>{report.points_earned} pts</span>
                </button>
              </div>

              {report.highlights && (
                <p className="text-sm">
                  <span className="font-medium">Highlights:</span> {report.highlights}
                </p>
              )}

              {showRejectionReason && report.review_notes && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{report.review_notes}</span>
                </div>
              )}

              {report.reviewer && (
                <p className="text-xs text-muted-foreground">
                  Reviewed by {report.reviewer.full_name}
                </p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              {showEdit && (
                <Button size="sm" variant="outline" onClick={() => handleEdit(report)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
              {report.status === "draft" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setDeleteReport(report)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                  <Button size="sm" onClick={() => handleSubmit(report.id)}>
                    <Send className="mr-1 h-4 w-4" />
                    Submit
                  </Button>
                </>
              )}
              {report.status === "rejected" && (
                <Button size="sm" onClick={() => handleSubmit(report.id)}>
                  <Send className="mr-1 h-4 w-4" />
                  Resubmit
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editReport} onOpenChange={(open) => !open && setEditReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Report - {editReport && MONTHS[editReport.month - 1]} {editReport?.year}
            </DialogTitle>
            <DialogDescription>
              Add your notes about this month&apos;s activities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="highlights">Highlights</Label>
              <Textarea
                id="highlights"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="What went well this month?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Challenges</Label>
              <Textarea
                id="challenges"
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="What challenges did you face?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Goals for Next Month</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What are your plans for next month?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Uses stored snapshot data (no database queries) */}
      <Dialog open={!!detailData} onOpenChange={(open) => !open && setDetailData(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDetailTitle()}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Sessions Table - from sessions_data snapshot */}
            {detailData?.type === "sessions" && (
              detailData.report.sessions_data && detailData.report.sessions_data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.report.sessions_data.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {new Date(session.session_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{session.title}</TableCell>
                        <TableCell>{session.attendance_count || 0}</TableCell>
                        <TableCell>
                          {session.attendance_rate != null ? `${session.attendance_rate}%` : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No confirmed sessions this month</p>
              )
            )}

            {/* Events Table - from events_data snapshot */}
            {detailData?.type === "events" && (
              detailData.report.events_data && detailData.report.events_data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Attendees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.report.events_data.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {new Date(event.event_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{event.title}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.confirmed_attendees || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No completed events this month</p>
              )
            )}

            {/* Members Table - from members_data snapshot */}
            {detailData?.type === "members" && (
              detailData.report.members_data && detailData.report.members_data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.report.members_data.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.user_name || "Unknown"}</TableCell>
                        <TableCell>{member.user_email || "-"}</TableCell>
                        <TableCell>
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No new members this month</p>
              )
            )}

            {/* Points Table - from points_data snapshot */}
            {detailData?.type === "points" && (
              detailData.report.points_data && detailData.report.points_data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.report.points_data.map((point, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(point.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{point.reason}</TableCell>
                        <TableCell className="text-right font-medium">+{point.amount}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {detailData.report.points_data.reduce((sum, p) => sum + p.amount, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No points earned this month</p>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteReport} onOpenChange={(open) => !open && setDeleteReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the report for {deleteReport && MONTHS[deleteReport.month - 1]} {deleteReport?.year}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteReport(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
