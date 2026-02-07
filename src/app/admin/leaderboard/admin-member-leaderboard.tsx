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
import { Trophy, Medal, Calendar, Users, CheckCircle, FileText, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MemberEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  region_id: string | null;
  region_name: string | null;
  club_id: string | null;
  club_name: string | null;
  total_points: number;
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

interface Club {
  id: string;
  name: string;
  region_id: string | null;
}

interface AdminMemberLeaderboardProps {
  entries: MemberEntry[];
  pointsByUser: Record<string, PointEntry[]>;
  regions: Region[];
  clubs: Club[];
}

function getPointIcon(referenceType: string | null) {
  switch (referenceType) {
    case "session":
      return <Calendar className="h-4 w-4" />;
    case "task":
      return <CheckCircle className="h-4 w-4" />;
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
    case "task":
      return "text-orange-600 bg-orange-50";
    case "manual":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-yellow-600 bg-yellow-50";
  }
}

export function AdminMemberLeaderboard({
  entries,
  pointsByUser,
  regions,
  clubs,
}: AdminMemberLeaderboardProps) {
  const [filterType, setFilterType] = useState<"platform" | "region" | "club">("platform");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<MemberEntry | null>(null);

  // Filter clubs by selected region
  const filteredClubs = selectedRegion === "all"
    ? clubs
    : clubs.filter(c => c.region_id === selectedRegion);

  // Filter entries based on filter type
  let filteredEntries = entries;
  if (filterType === "region" && selectedRegion !== "all") {
    filteredEntries = entries.filter(e => e.region_id === selectedRegion);
  } else if (filterType === "club" && selectedClub !== "all") {
    filteredEntries = entries.filter(e => e.club_id === selectedClub);
  }

  // Re-rank after filtering
  const rankedEntries = filteredEntries
    .sort((a, b) => b.total_points - a.total_points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const userPoints = selectedUser ? pointsByUser[selectedUser.user_id] || [] : [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">View:</span>
        <Select value={filterType} onValueChange={(v) => {
          setFilterType(v as "platform" | "region" | "club");
          setSelectedRegion("all");
          setSelectedClub("all");
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="platform">All Platform</SelectItem>
            <SelectItem value="region">By Region</SelectItem>
            <SelectItem value="club">By Club</SelectItem>
          </SelectContent>
        </Select>

        {filterType === "region" && (
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterType === "club" && (
          <>
            <Select value={selectedRegion} onValueChange={(v) => {
              setSelectedRegion(v);
              setSelectedClub("all");
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {filteredClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <span className="text-sm text-muted-foreground ml-2">
          ({filteredEntries.length} members)
        </span>
      </div>

      {rankedEntries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No members found.</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">#</div>
              <div className="w-8" />
              <div>Member</div>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Points
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
                    <div className="text-xs text-muted-foreground">
                      {entry.club_name && <span>{entry.club_name}</span>}
                      {entry.club_name && entry.region_name && <span> • </span>}
                      {entry.region_name && <span>{entry.region_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Trophy className="h-4 w-4" />
                  <span className="font-bold">{entry.total_points}</span>
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
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedUser.club_name && <span>{selectedUser.club_name}</span>}
                      {selectedUser.club_name && selectedUser.region_name && <span> • </span>}
                      {selectedUser.region_name && <span>{selectedUser.region_name}</span>}
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Trophy className="h-4 w-4" />
                  Total Points
                </div>
                <div className="text-3xl font-bold">{selectedUser.total_points}</div>
              </div>

              {/* Points History */}
              <div>
                <h4 className="font-medium mb-2">Points History</h4>
                {userPoints.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No points earned yet.</p>
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
