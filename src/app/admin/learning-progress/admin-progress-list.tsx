"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  LinkIcon,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  exode_user_id: number | null;
  exode_course_points: number | null;
  exode_points_synced_at: string | null;
  region_id: string | null;
  region_name: string | null;
}

interface PracticeAttempt {
  lessonName: string;
  lessonId: number;
  status: string;
  correctPercent: number;
  points: string;
  pointsAmount: number;
  maxPointsAmount: number;
  attemptOrder: number;
  createdAt: string;
  sentToReviewAt: string;
  lastOnline: string;
}

interface AdminProgressListProps {
  users: User[];
  showRegion?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Verified":
    case "AutoVerified":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "OnReview":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "Failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "OnCorrection":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Verified":
    case "AutoVerified":
      return <Badge className="bg-green-100 text-green-700">Verified</Badge>;
    case "OnReview":
      return <Badge className="bg-yellow-100 text-yellow-700">On Review</Badge>;
    case "Failed":
      return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
    case "OnCorrection":
      return <Badge className="bg-orange-100 text-orange-700">Correction</Badge>;
    case "Created":
      return <Badge className="bg-gray-100 text-gray-700">Created</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function UserProgressItem({ user, showRegion }: { user: User; showRegion: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const loadProgress = async () => {
    if (loaded || !user.exode_user_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/exode/user-progress?exodeUserId=${user.exode_user_id}`
      );
      const data = await response.json();

      if (data.success) {
        setAttempts(data.attempts || []);
      }
      setLoaded(true);
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && !loaded) {
      loadProgress();
    }
    setIsOpen(!isOpen);
  };

  // Group attempts by lesson
  const lessonAttempts = attempts.reduce((acc, attempt) => {
    const key = attempt.lessonId || attempt.lessonName;
    if (!acc[key]) {
      acc[key] = {
        lessonName: attempt.lessonName,
        attempts: [],
      };
    }
    acc[key].attempts.push(attempt);
    return acc;
  }, {} as Record<string | number, { lessonName: string; attempts: PracticeAttempt[] }>);

  const isLinked = !!user.exode_user_id;

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            disabled={!isLinked}
          >
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-medium">{user.full_name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {showRegion && user.region_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {user.region_name}
                    </span>
                  )}
                  {isLinked ? (
                    <>
                      {showRegion && user.region_name && <span>·</span>}
                      <span>
                        {user.exode_course_points || 0} stars
                        {user.exode_points_synced_at && (
                          <> · Synced {formatDistanceToNow(new Date(user.exode_points_synced_at), { addSuffix: true })}</>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      {showRegion && user.region_name && <span>·</span>}
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        Exode not linked
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLinked && (
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {user.exode_course_points || 0}
                </Badge>
              )}
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attempts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No practice attempts yet.
              </p>
            ) : (
              <div className="space-y-4 mt-4">
                {Object.values(lessonAttempts).map((lesson, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-medium text-sm">{lesson.lessonName}</h4>
                    <div className="space-y-2 pl-4">
                      {lesson.attempts.map((attempt, attemptIdx) => (
                        <div
                          key={attemptIdx}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(attempt.status)}
                            <span>Attempt #{attempt.attemptOrder}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {attempt.pointsAmount}/{attempt.maxPointsAmount} pts
                            </span>
                            <span className="text-muted-foreground">
                              {attempt.correctPercent}%
                            </span>
                            {getStatusBadge(attempt.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function AdminProgressList({ users, showRegion = false }: AdminProgressListProps) {
  // Sort: linked users first, then by name
  const sortedUsers = [...users].sort((a, b) => {
    if (a.exode_user_id && !b.exode_user_id) return -1;
    if (!a.exode_user_id && b.exode_user_id) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const linkedCount = users.filter((u) => u.exode_user_id).length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {linkedCount} of {users.length} users have linked their Exode accounts
      </div>
      <div className="space-y-2">
        {sortedUsers.map((user) => (
          <UserProgressItem key={user.id} user={user} showRegion={showRegion} />
        ))}
      </div>
    </div>
  );
}
