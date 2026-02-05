"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Report, User, Club } from "@/types";
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
  Check,
  X,
  Loader2,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type ReportWithRelations = Report & {
  ambassador: Pick<User, "full_name"> | null;
  clubs: Pick<Club, "name"> | null;
};

interface LeadReportsListProps {
  reports: ReportWithRelations[];
  userId: string;
  showActions?: boolean;
}

export function LeadReportsList({ reports, userId, showActions }: LeadReportsListProps) {
  const router = useRouter();
  const [rejectReport, setRejectReport] = useState<ReportWithRelations | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (reportId: string) => {
    setLoading(reportId);
    const supabase = createClient();

    const { error } = await supabase
      .from("reports")
      .update({
        status: "approved",
        reviewer_id: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report approved!");
      router.refresh();
    }

    setLoading(null);
  };

  const handleReject = async () => {
    if (!rejectReport) return;
    setLoading(rejectReport.id);

    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        status: "rejected",
        reviewer_id: userId,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", rejectReport.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report rejected");
      setRejectReport(null);
      setReviewNotes("");
      router.refresh();
    }

    setLoading(null);
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">
                  {MONTHS[report.month - 1]} {report.year}
                </h3>
                <Badge variant={
                  report.status === "approved" ? "default" :
                  report.status === "rejected" ? "destructive" :
                  "outline"
                }>
                  {report.status}
                </Badge>
              </div>

              <p className="text-sm">
                <span className="font-medium">{report.ambassador?.full_name}</span>
                <span className="text-muted-foreground"> • {report.clubs?.name}</span>
              </p>

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
                <div className="text-sm">
                  <span className="font-medium">Highlights:</span>
                  <p className="text-muted-foreground">{report.highlights}</p>
                </div>
              )}
              {report.challenges && (
                <div className="text-sm">
                  <span className="font-medium">Challenges:</span>
                  <p className="text-muted-foreground">{report.challenges}</p>
                </div>
              )}
              {report.goals && (
                <div className="text-sm">
                  <span className="font-medium">Goals:</span>
                  <p className="text-muted-foreground">{report.goals}</p>
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleApprove(report.id)}
                  disabled={loading === report.id}
                >
                  {loading === report.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectReport(report)}
                  disabled={loading === report.id}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectReport} onOpenChange={(open) => !open && setRejectReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Provide feedback for {rejectReport?.ambassador?.full_name}&apos;s report
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reviewNotes">Feedback (optional)</Label>
            <Textarea
              id="reviewNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="What needs to be improved?"
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectReport(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading === rejectReport?.id}
            >
              {loading === rejectReport?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
