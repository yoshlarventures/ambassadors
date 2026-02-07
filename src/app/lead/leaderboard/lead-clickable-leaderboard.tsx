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
import { Trophy, Medal, GraduationCap, Calendar, Users, CheckCircle, FileText, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  exode_course_points: number;
  full_name: string;
  avatar_url: string | null;
  region_id?: string | null;
  region_name?: string | null;
  club_id?: string | null;
  club_name?: string | null;
}

interface PointEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

interface LeadClickableLeaderboardProps {
  entries: LeaderboardEntry[];
  pointsByUser: Record<string, PointEntry[]>;
  /** IDs of users whose profiles are clickable. undefined = all, empty array = none */
  clickableUserIds?: string[];
  currentUserId?: string;
  showExodeCourse?: boolean;
  showSubtext?: "region" | "club" | "club_and_region" | "none";
  /** Primary filter (e.g. All/My Region) - filters by region_id */
  scopeFilter?: {
    label: string;
    options: FilterOption[];
    field: "region_id" | "club_id";
  };
  /** Secondary filter for clubs */
  clubFilter?: {
    options: FilterOption[];
  };
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
    case "manual":
      return <Gift className="h-4 w-4" />;
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
    case "manual":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-yellow-600 bg-yellow-50";
  }
}

export function LeadClickableLeaderboard({
  entries,
  pointsByUser,
  clickableUserIds,
  currentUserId,
  showExodeCourse = true,
  showSubtext = "none",
  scopeFilter,
  clubFilter,
}: LeadClickableLeaderboardProps) {
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [scopeValue, setScopeValue] = useState<string>("all");
  const [clubValue, setClubValue] = useState<string>("all");

  // Apply scope filter
  let filteredEntries = entries;
  if (scopeFilter && scopeValue !== "all") {
    const field = scopeFilter.field;
    filteredEntries = entries.filter(e => {
      if (field === "region_id") return e.region_id === scopeValue;
      if (field === "club_id") return e.club_id === scopeValue;
      return true;
    });
  }

  // Apply club filter
  if (clubFilter && clubValue !== "all") {
    filteredEntries = filteredEntries.filter(e => e.club_id === clubValue);
  }

  // Sort and rank
  const rankedEntries = [...filteredEntries]
    .sort((a, b) => (b.total_points + b.exode_course_points) - (a.total_points + a.exode_course_points))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const isClickable = (userId: string) => {
    if (clickableUserIds === undefined) return true;
    return clickableUserIds.includes(userId);
  };

  const userPoints = selectedUser ? pointsByUser[selectedUser.user_id] || [] : [];

  const getSubtext = (entry: LeaderboardEntry) => {
    if (showSubtext === "club") return entry.club_name || null;
    if (showSubtext === "region") return entry.region_name || null;
    if (showSubtext === "club_and_region") {
      const parts = [entry.club_name, entry.region_name].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : null;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      {(scopeFilter || clubFilter) && (
        <div className="flex flex-wrap items-center gap-3">
          {scopeFilter && (
            <>
              <span className="text-sm text-muted-foreground">{scopeFilter.label}:</span>
              <Select value={scopeValue} onValueChange={(v) => {
                setScopeValue(v);
                setClubValue("all");
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {scopeFilter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {clubFilter && (
            <>
              <span className="text-sm text-muted-foreground">Club:</span>
              <Select value={clubValue} onValueChange={setClubValue}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  {clubFilter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          <span className="text-sm text-muted-foreground">
            ({filteredEntries.length} entries)
          </span>
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
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Platform
              </div>
              {showExodeCourse && (
                <>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    Course
                  </div>
                  <div className="w-16 text-right">Total</div>
                </>
              )}
            </div>
          </div>

          {/* Entries */}
          {rankedEntries.slice(0, 100).map((entry) => {
            const initials = entry.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const isCurrentUser = entry.user_id === currentUserId;
            const totalCombined = entry.total_points + entry.exode_course_points;
            const canClick = isClickable(entry.user_id);
            const subtext = getSubtext(entry);

            const content = (
              <>
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
                    {subtext && (
                      <div className="text-xs text-muted-foreground">{subtext}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Trophy className="h-4 w-4" />
                    <span className="font-bold">{entry.total_points}</span>
                  </div>
                  {showExodeCourse && (
                    <>
                      <div className="flex items-center gap-1 text-blue-600">
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-bold">{entry.exode_course_points}</span>
                      </div>
                      <div className="w-16 text-right font-bold text-muted-foreground">
                        = {totalCombined}
                      </div>
                    </>
                  )}
                </div>
              </>
            );

            if (canClick) {
              return (
                <Button
                  key={entry.user_id}
                  variant="ghost"
                  className={`w-full justify-between p-3 h-auto hover:bg-muted/50 ${
                    isCurrentUser ? "bg-primary/10 border border-primary/20" : ""
                  }`}
                  onClick={() => setSelectedUser(entry)}
                >
                  {content}
                </Button>
              );
            }

            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentUser ? "bg-primary/10 border border-primary/20" : ""
                }`}
              >
                {content}
              </div>
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
                    {getSubtext(selectedUser) && (
                      <div className="text-sm text-muted-foreground font-normal">
                        {getSubtext(selectedUser)}
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
              <div className={`grid gap-4 ${showExodeCourse ? "grid-cols-3" : "grid-cols-1"}`}>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                    <Trophy className="h-4 w-4" />
                    Platform
                  </div>
                  <div className="text-2xl font-bold">{selectedUser.total_points}</div>
                </div>
                {showExodeCourse && (
                  <>
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
                  </>
                )}
              </div>

              {/* Exode Points */}
              {showExodeCourse && selectedUser.exode_course_points > 0 && (
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
                <h4 className="font-medium mb-2">Points History</h4>
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
