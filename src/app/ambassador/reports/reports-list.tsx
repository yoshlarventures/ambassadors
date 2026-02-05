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
import { toast } from "sonner";
import {
  Calendar,
  Users,
  FileText,
  Trophy,
  Send,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type ReportWithReviewer = Report & {
  reviewer: Pick<User, "full_name"> | null;
};

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

  if (reports.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No reports found</p>;
  }

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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{report.sessions_count} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{report.total_attendance} attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{report.events_count} events</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>{report.points_earned} pts</span>
                </div>
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
                <Button size="sm" onClick={() => handleSubmit(report.id)}>
                  <Send className="mr-1 h-4 w-4" />
                  Submit
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
    </>
  );
}
