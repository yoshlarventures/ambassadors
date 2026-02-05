import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

async function getLeaderboard() {
  const supabase = await createClient();

  // Get all points with user info
  const { data: points } = await supabase
    .from("points")
    .select("user_id, amount, users(id, full_name, avatar_url, region_id, regions(name))");

  if (!points) return [];

  // Aggregate by user
  const userPoints: Record<string, {
    user_id: string;
    total_points: number;
    full_name: string;
    avatar_url: string | null;
    region_name: string | null;
  }> = {};

  points.forEach((p) => {
    const user = p.users as unknown as { id: string; full_name: string; avatar_url: string | null; region_id: string | null; regions: { name: string } | null } | null;
    if (!user) return;

    if (!userPoints[p.user_id]) {
      userPoints[p.user_id] = {
        user_id: p.user_id,
        total_points: 0,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        region_name: user.regions?.name || null,
      };
    }
    userPoints[p.user_id].total_points += p.amount;
  });

  return Object.values(userPoints)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 50);
}

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const leaderboard = await getLeaderboard();

  const currentUserRank = leaderboard.findIndex(l => l.user_id === user?.id) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top performing ambassadors</p>
      </div>

      {currentUserRank > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Rank</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">#{currentUserRank}</Badge>
                <span className="font-bold">
                  {leaderboard[currentUserRank - 1]?.total_points || 0} pts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 50 Ambassadors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No points earned yet. Start organizing sessions and events!
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const initials = entry.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isCurrentUser = entry.user_id === user?.id;
                const rank = index + 1;

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
                          <Medal className={`h-5 w-5 mx-auto ${
                            rank === 1 ? "text-yellow-500" :
                            rank === 2 ? "text-gray-400" :
                            "text-amber-600"
                          }`} />
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
                        {entry.region_name && (
                          <div className="text-xs text-muted-foreground">
                            {entry.region_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold">{entry.total_points} pts</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
