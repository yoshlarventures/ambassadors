"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Trophy, CheckCircle, Calendar, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PointEntry {
  id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

interface PointsHistoryProps {
  points: PointEntry[];
  exodeCoursePoints: number;
  exodePointsSyncedAt: string | null;
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

export function PointsHistory({ points, exodeCoursePoints, exodePointsSyncedAt }: PointsHistoryProps) {
  const totalPlatformPoints = points.reduce((sum, p) => sum + p.amount, 0);
  const totalPoints = totalPlatformPoints + exodeCoursePoints;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Platform Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlatformPoints}</div>
            <p className="text-xs text-muted-foreground">From tasks, sessions, events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              Course Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exodeCoursePoints}</div>
            <p className="text-xs text-muted-foreground">
              {exodePointsSyncedAt
                ? `Synced ${formatDistanceToNow(new Date(exodePointsSyncedAt), { addSuffix: true })}`
                : "From Exode learning"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">Combined score</p>
          </CardContent>
        </Card>
      </div>

      {/* Points History List */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Exode Course Points Entry */}
          {exodeCoursePoints > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-blue-100`}>
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Exode Learning Course</div>
                  <div className="text-xs text-muted-foreground">
                    {exodePointsSyncedAt
                      ? `Last synced ${formatDistanceToNow(new Date(exodePointsSyncedAt), { addSuffix: true })}`
                      : "Stars from learning platform"}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                +{exodeCoursePoints}
              </Badge>
            </div>
          )}

          {/* Platform Points Entries */}
          {points.length === 0 && exodeCoursePoints === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No points earned yet. Complete tasks, organize sessions, and learn courses to earn points!
            </p>
          ) : points.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No platform points yet. Complete tasks and organize sessions to earn more!
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
