"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Percent,
  FileText,
  UserPlus,
  Trophy,
  Users,
} from "lucide-react";
import { SessionSnapshot, EventSnapshot, MemberSnapshot, PointSnapshot } from "@/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Ambassador {
  id: string;
  full_name: string;
  region_id: string;
  region_name: string;
  clubs: string[];
}

interface ReportStatus {
  ambassador_id: string;
  month: number;
  year: number;
  status: string;
  id: string;
  sessions_count: number;
  total_attendance: number;
  events_count: number;
  events_attendance: number;
  new_members_count: number;
  points_earned: number;
  attendance_rate: number | null;
  highlights: string | null;
  challenges: string | null;
  goals: string | null;
  sessions_data: SessionSnapshot[] | null;
  events_data: EventSnapshot[] | null;
  members_data: MemberSnapshot[] | null;
  points_data: PointSnapshot[] | null;
}

interface Region {
  id: string;
  name: string;
}

interface ReportsOverviewTableProps {
  ambassadors: Ambassador[];
  reports: ReportStatus[];
  regions: Region[];
  year: number;
  currentYear: number;
}

export function ReportsOverviewTable({
  ambassadors,
  reports,
  regions,
  year,
  currentYear,
}: ReportsOverviewTableProps) {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<{
    report: ReportStatus;
    ambassadorName: string;
  } | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "sessions" | "events" | "members" | "points">("overview");

  // Build a map of ambassador_id -> month -> report status
  const reportMap = new Map<string, Map<number, ReportStatus>>();
  reports.forEach((r) => {
    if (!reportMap.has(r.ambassador_id)) {
      reportMap.set(r.ambassador_id, new Map());
    }
    reportMap.get(r.ambassador_id)!.set(r.month, r);
  });

  // Filter ambassadors by region
  const filteredAmbassadors = selectedRegion === "all"
    ? ambassadors
    : ambassadors.filter(a => a.region_id === selectedRegion || (selectedRegion === "" && !a.region_id));

  // Group by region
  const groupedByRegion = new Map<string, Ambassador[]>();
  filteredAmbassadors.forEach((a) => {
    const regionKey = a.region_id || "";
    if (!groupedByRegion.has(regionKey)) {
      groupedByRegion.set(regionKey, []);
    }
    groupedByRegion.get(regionKey)!.push(a);
  });

  // Sort regions
  const sortedRegions = Array.from(groupedByRegion.keys()).sort((a, b) => {
    const nameA = regions.find(r => r.id === a)?.name || "No Region";
    const nameB = regions.find(r => r.id === b)?.name || "No Region";
    if (nameA === "No Region") return 1;
    if (nameB === "No Region") return -1;
    return nameA.localeCompare(nameB);
  });

  const getStatusBadge = (report: ReportStatus | undefined, ambassadorName: string) => {
    if (!report) return <span className="text-muted-foreground">-</span>;

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      submitted: "outline",
      rejected: "destructive",
      draft: "secondary",
    };

    const labels: Record<string, string> = {
      approved: "A",
      submitted: "S",
      rejected: "R",
      draft: "D",
    };

    return (
      <button
        onClick={() => {
          setSelectedReport({ report, ambassadorName });
          setDetailTab("overview");
        }}
        className="hover:scale-110 transition-transform"
      >
        <Badge variant={variants[report.status] || "secondary"} className="text-xs px-1.5 py-0 cursor-pointer">
          {labels[report.status] || report.status[0].toUpperCase()}
        </Badge>
      </button>
    );
  };

  const handleYearChange = (direction: number) => {
    router.push(`/admin/reports/overview?year=${year + direction}`);
  };

  // Get current month for highlighting
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[60px] text-center">{year}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange(1)}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by region:</span>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id || "no-region"} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Badge variant="default" className="px-1.5 py-0">A</Badge>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="px-1.5 py-0">S</Badge>
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="destructive" className="px-1.5 py-0">R</Badge>
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="px-1.5 py-0">D</Badge>
            <span>Draft</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">
                Ambassador
              </TableHead>
              <TableHead className="min-w-[120px]">Clubs</TableHead>
              {MONTHS.map((month, idx) => (
                <TableHead
                  key={month}
                  className={`text-center min-w-[50px] ${
                    year === currentYear && idx + 1 === currentMonth
                      ? "bg-primary/10"
                      : ""
                  }`}
                >
                  {month}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRegions.map((regionId) => {
              const regionName = regions.find(r => r.id === regionId)?.name || "No Region";
              const regionAmbassadors = groupedByRegion.get(regionId) || [];

              return (
                <>
                  {/* Region Header Row */}
                  {selectedRegion === "all" && (
                    <TableRow key={`region-${regionId}`} className="bg-muted/50">
                      <TableCell
                        colSpan={14}
                        className="font-semibold text-sm py-2"
                      >
                        {regionName} ({regionAmbassadors.length})
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Ambassador Rows */}
                  {regionAmbassadors.map((ambassador) => {
                    const ambassadorReports = reportMap.get(ambassador.id);

                    return (
                      <TableRow key={ambassador.id}>
                        <TableCell className="font-medium sticky left-0 bg-background">
                          {ambassador.full_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ambassador.clubs.length > 0
                            ? ambassador.clubs.join(", ")
                            : "-"}
                        </TableCell>
                        {MONTHS.map((_, idx) => {
                          const monthNum = idx + 1;
                          const report = ambassadorReports?.get(monthNum);
                          const isFutureMonth = year === currentYear && monthNum > currentMonth;

                          return (
                            <TableCell
                              key={monthNum}
                              className={`text-center ${
                                year === currentYear && monthNum === currentMonth
                                  ? "bg-primary/10"
                                  : ""
                              } ${isFutureMonth ? "text-muted-foreground/30" : ""}`}
                            >
                              {isFutureMonth ? "-" : getStatusBadge(report, ambassador.full_name)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </>
              );
            })}

            {filteredAmbassadors.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                  No ambassadors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.ambassadorName} - {selectedReport && FULL_MONTHS[selectedReport.report.month - 1]} {selectedReport?.report.year}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={
                  selectedReport.report.status === "approved" ? "default" :
                  selectedReport.report.status === "submitted" ? "outline" :
                  selectedReport.report.status === "rejected" ? "destructive" :
                  "secondary"
                }>
                  {selectedReport.report.status}
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="font-medium">{selectedReport.report.sessions_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="font-medium">
                      {selectedReport.report.attendance_rate != null ? `${selectedReport.report.attendance_rate}%` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Attendance</p>
                    <p className="font-medium">{selectedReport.report.total_attendance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Events</p>
                    <p className="font-medium">{selectedReport.report.events_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">New Members</p>
                    <p className="font-medium">{selectedReport.report.new_members_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Points Earned</p>
                    <p className="font-medium">{selectedReport.report.points_earned}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedReport.report.highlights || selectedReport.report.challenges || selectedReport.report.goals) && (
                <div className="space-y-3">
                  {selectedReport.report.highlights && (
                    <div>
                      <p className="text-sm font-medium">Highlights</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.report.highlights}</p>
                    </div>
                  )}
                  {selectedReport.report.challenges && (
                    <div>
                      <p className="text-sm font-medium">Challenges</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.report.challenges}</p>
                    </div>
                  )}
                  {selectedReport.report.goals && (
                    <div>
                      <p className="text-sm font-medium">Goals</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.report.goals}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detail Tabs */}
              <div className="border-t pt-4">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    size="sm"
                    variant={detailTab === "sessions" ? "default" : "outline"}
                    onClick={() => setDetailTab("sessions")}
                  >
                    Sessions ({selectedReport.report.sessions_count})
                  </Button>
                  <Button
                    size="sm"
                    variant={detailTab === "events" ? "default" : "outline"}
                    onClick={() => setDetailTab("events")}
                  >
                    Events ({selectedReport.report.events_count})
                  </Button>
                  <Button
                    size="sm"
                    variant={detailTab === "members" ? "default" : "outline"}
                    onClick={() => setDetailTab("members")}
                  >
                    New Members ({selectedReport.report.new_members_count})
                  </Button>
                  <Button
                    size="sm"
                    variant={detailTab === "points" ? "default" : "outline"}
                    onClick={() => setDetailTab("points")}
                  >
                    Points ({selectedReport.report.points_earned})
                  </Button>
                </div>

                {/* Sessions Table */}
                {detailTab === "sessions" && (
                  selectedReport.report.sessions_data && selectedReport.report.sessions_data.length > 0 ? (
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
                        {selectedReport.report.sessions_data.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                            <TableCell>{session.title}</TableCell>
                            <TableCell>{session.attendance_count}</TableCell>
                            <TableCell>{session.attendance_rate != null ? `${session.attendance_rate}%` : "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No sessions data</p>
                  )
                )}

                {/* Events Table */}
                {detailTab === "events" && (
                  selectedReport.report.events_data && selectedReport.report.events_data.length > 0 ? (
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
                        {selectedReport.report.events_data.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                            <TableCell>{event.title}</TableCell>
                            <TableCell>{event.location}</TableCell>
                            <TableCell>{event.confirmed_attendees || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No events data</p>
                  )
                )}

                {/* Members Table */}
                {detailTab === "members" && (
                  selectedReport.report.members_data && selectedReport.report.members_data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.report.members_data.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.user_name}</TableCell>
                            <TableCell>{member.user_email}</TableCell>
                            <TableCell>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No new members data</p>
                  )
                )}

                {/* Points Table */}
                {detailTab === "points" && (
                  selectedReport.report.points_data && selectedReport.report.points_data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.report.points_data.map((point, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{new Date(point.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{point.reason}</TableCell>
                            <TableCell className="text-right font-medium">+{point.amount}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={2} className="font-medium">Total</TableCell>
                          <TableCell className="text-right font-bold">
                            {selectedReport.report.points_data.reduce((sum, p) => sum + p.amount, 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No points data</p>
                  )
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
