"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, CheckCircle, Users, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PointEntry {
  id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

interface MemberPointsHistoryProps {
  points: PointEntry[];
}

function getPointIcon(referenceType: string | null) {
  switch (referenceType) {
    case "session":
      return <Calendar className="h-4 w-4" />;
    case "task":
      return <CheckCircle className="h-4 w-4" />;
    case "manual":
      return <Star className="h-4 w-4" />;
    case "member":
      return <Users className="h-4 w-4" />;
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
    case "member":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-yellow-600 bg-yellow-50";
  }
}

export function MemberPointsHistory({ points }: MemberPointsHistoryProps) {
  const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Total Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPoints}</div>
          <p className="text-xs text-muted-foreground">From attendance, tasks, and rewards</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {points.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No points earned yet. Attend sessions and complete tasks to earn points!
            </p>
          ) : (
            <div className="space-y-2">
              {points.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getPointColor(entry.reference_type)}`}>
                      {getPointIcon(entry.reference_type)}
                    </div>
                    <div>
                      <div className="font-medium">{entry.reason}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getPointColor(entry.reference_type)}>
                    +{entry.amount}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
