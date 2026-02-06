"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

interface Report {
  id: string;
  month: number;
  year: number;
  sessions_count: number;
  events_count: number;
  points_earned: number;
  attendance_rate: number | null;
  status: string;
  ambassador: { id: string; full_name: string } | null;
  clubs: { name: string; regions: { name: string } | null } | null;
  all_clubs: string[];
}

interface AdminReportsTableProps {
  reports: Report[];
}

export function AdminReportsTable({ reports }: AdminReportsTableProps) {
  const router = useRouter();
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteReport) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", deleteReport.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Report deleted");
      setDeleteReport(null);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Ambassador</TableHead>
            <TableHead>Club</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                {MONTHS[report.month - 1]} {report.year}
              </TableCell>
              <TableCell>
                {report.ambassador?.full_name}
              </TableCell>
              <TableCell>
                {report.all_clubs.length > 0 ? report.all_clubs.join(", ") : report.clubs?.name || "-"}
              </TableCell>
              <TableCell>
                {report.clubs?.regions?.name}
              </TableCell>
              <TableCell>{report.sessions_count}</TableCell>
              <TableCell>{report.attendance_rate != null ? `${report.attendance_rate}%` : "N/A"}</TableCell>
              <TableCell>{report.events_count}</TableCell>
              <TableCell>{report.points_earned}</TableCell>
              <TableCell>
                <Badge variant={
                  report.status === "approved" ? "default" :
                  report.status === "submitted" ? "outline" :
                  report.status === "rejected" ? "destructive" :
                  "secondary"
                }>
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteReport(report)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                No reports found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteReport} onOpenChange={(open) => !open && setDeleteReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the report for {deleteReport && MONTHS[deleteReport.month - 1]} {deleteReport?.year} by {deleteReport?.ambassador?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteReport(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
