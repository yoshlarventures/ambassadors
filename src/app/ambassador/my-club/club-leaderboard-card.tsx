import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
}

interface ClubLeaderboardCardProps {
  leaderboard: LeaderboardEntry[];
}

export function ClubLeaderboardCard({ leaderboard }: ClubLeaderboardCardProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Member Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No members have earned points yet.
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const initials = entry.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-bold">
                      {rank <= 3 ? (
                        <Medal
                          className={`h-4 w-4 mx-auto ${
                            rank === 1
                              ? "text-yellow-500"
                              : rank === 2
                              ? "text-gray-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">#{rank}</span>
                      )}
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.full_name}</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">
                    {entry.total_points} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
