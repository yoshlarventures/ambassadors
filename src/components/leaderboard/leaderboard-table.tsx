import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, GraduationCap } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  exode_course_points: number;
  full_name: string;
  avatar_url: string | null;
  region_name?: string | null;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  title: string;
  showRegion?: boolean;
  emptyMessage?: string;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  title,
  showRegion = false,
  emptyMessage = "No entries yet.",
}: LeaderboardTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
          </div>
          <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Platform
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              Course
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const initials = entry.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const isCurrentUser = entry.user_id === currentUserId;
              const rank = index + 1;
              const totalCombined = entry.total_points + entry.exode_course_points;

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold">
                      {rank <= 3 ? (
                        <Medal
                          className={`h-5 w-5 mx-auto ${
                            rank === 1
                              ? "text-yellow-500"
                              : rank === 2
                              ? "text-gray-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-muted-foreground">#{rank}</span>
                      )}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.full_name}</div>
                      {showRegion && entry.region_name && (
                        <div className="text-xs text-muted-foreground">{entry.region_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold">{entry.total_points}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="font-bold">{entry.exode_course_points}</span>
                    </div>
                    <div className="w-16 text-right font-bold text-muted-foreground">
                      = {totalCombined}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
