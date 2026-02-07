"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Medal, GraduationCap, Calendar, Users, CheckCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  exode_course_points: number;
  full_name: string;
  avatar_url: string | null;
  region_id: string | null;
  region_name: string | null;
}

interface PointEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

interface Region {
  id: string;
  name: string;
}

interface AdminLeaderboardTableProps {
  entries: LeaderboardEntry[];
  pointsByUser: Record<string, PointEntry[]>;
  regions?: Region[];
  showRegion?: boolean;
  showFilter?: boolean;
}

function getPointIcon(referenceType: string | null) {
  switch (referenceType) {
    case "session":
      return <Calendar className="h-4 w-4" />;
    case "event":
      return <Trophy className="h-4 w-4" />;
    case "member":
      return <Users className="h-4 w-4" />;
    case "task":
      return <CheckCircle className="h-4 w-4" />;
    case "report":
      return <FileText className="h-4 w-4" />;
    default:
      return <Trophy className="h-4 w-4" />;
  }
}

function getPointColor(referenceType: string | null) {
  switch (referenceType) {
    case "session":
      return "text-green-600 bg-green-50";
    case "event":
      return "text-purple-600 bg-purple-50";
    case "member":
      return "text-blue-600 bg-blue-50";
    case "task":
      return "text-orange-600 bg-orange-50";
    case "report":
      return "text-cyan-600 bg-cyan-50";
    default:
      return "text-yellow-600 bg-yellow-50";
  }
}

export function AdminLeaderboardTable({
  entries,
  pointsByUser,
  regions,
  showRegion = false,
  showFilter = false,
}: AdminLeaderboardTableProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const filteredEntries = selectedRegion === "all"
    ? entries
    : entries.filter((e) => e.region_id === selectedRegion);

  // Re-rank after filtering
  const rankedEntries = filteredEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const userPoints = selectedUser ? pointsByUser[selectedUser.user_id] || [] : [];

  return (
    <div className="space-y-4">
      {showFilter && regions && regions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by region:</span>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRegion !== "all" && (
            <span className="text-sm text-muted-foreground">
              ({filteredEntries.length} ambassadors)
            </span>
          )}
        </div>
      )}

      {rankedEntries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No entries found.</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">#</div>
              <div className="w-8" />
              <div>Name</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-16 justify-end">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Platform
              </div>
              <div className="flex items-center gap-1 w-16 justify-end">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Course
              </div>
              <div className="w-16 text-right">Total</div>
            </div>
          </div>

          {/* Entries */}
          {rankedEntries.map((entry) => {
            const initials = entry.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const totalCombined = entry.total_points + entry.exode_course_points;

            return (
              <Button
                key={entry.user_id}
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-muted/50"
                onClick={() => setSelectedUser(entry)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold">
                    {entry.rank <= 3 ? (
                      <Medal
                        className={`h-5 w-5 mx-auto ${
                          entry.rank === 1
                            ? "text-yellow-500"
                            : entry.rank === 2
                            ? "text-gray-400"
                            : "text-amber-600"
                        }`}
                      />
                    ) : (
                      <span className="text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{entry.full_name}</div>
                    {showRegion && entry.region_name && (
                      <div className="text-xs text-muted-foreground">{entry.region_name}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-yellow-600 w-16 justify-end">
                    <Trophy className="h-4 w-4" />
                    <span className="font-bold">{entry.total_points}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 w-16 justify-end">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-bold">{entry.exode_course_points}</span>
                  </div>
                  <div className="w-16 text-right font-bold text-muted-foreground">
                    = {totalCombined}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      )}

      {/* Point History Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedUser.full_name}</div>
                    {selectedUser.region_name && (
                      <div className="text-sm text-muted-foreground font-normal">
                        {selectedUser.region_name}
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                    <Trophy className="h-4 w-4" />
                    Platform
                  </div>
                  <div className="text-2xl font-bold">{selectedUser.total_points}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <GraduationCap className="h-4 w-4" />
                    Course
                  </div>
                  <div className="text-2xl font-bold">{selectedUser.exode_course_points}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-muted-foreground mb-1">Total</div>
                  <div className="text-2xl font-bold">
                    {selectedUser.total_points + selectedUser.exode_course_points}
                  </div>
                </div>
              </div>

              {/* Exode Points */}
              {selectedUser.exode_course_points > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Exode Learning Course</div>
                      <div className="text-xs text-muted-foreground">Stars from learning platform</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                    +{selectedUser.exode_course_points}
                  </Badge>
                </div>
              )}

              {/* Platform Points History */}
              <div>
                <h4 className="font-medium mb-2">Platform Points History</h4>
                {userPoints.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No platform points earned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {userPoints.map((point) => (
                      <div
                        key={point.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getPointColor(point.reference_type)}`}>
                            {getPointIcon(point.reference_type)}
                          </div>
                          <div>
                            <div className="font-medium">{point.reason}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(point.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={getPointColor(point.reference_type)}>
                          +{point.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
