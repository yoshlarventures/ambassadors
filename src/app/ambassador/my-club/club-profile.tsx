"use client";

import { Club, Region } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Ambassador {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface ClubProfileProps {
  club: Club & { regions: { name: string; name_uz: string } | null };
  regions: Region[];
  pendingMemberCount?: number;
  ambassadors?: Ambassador[];
  attendanceRate?: number | null;
}

export function ClubProfile({ club, ambassadors = [], attendanceRate }: ClubProfileProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Club Profile</CardTitle>
        <CardDescription>
          Your club information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Club Name</p>
          <p className="text-base">{club.name}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Region</p>
          <p className="text-base">{club.regions?.name || "Not set"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Description</p>
          <p className="text-base">{club.description || "No description"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Address / Meeting Location</p>
          <p className="text-base">{club.address || "Not set"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Ambassadors</p>
          {ambassadors.length > 0 ? (
            <div className="space-y-2">
              {ambassadors.map((ambassador) => {
                const initials = ambassador.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div key={ambassador.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ambassador.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{ambassador.full_name}</p>
                      <p className="text-xs text-muted-foreground">{ambassador.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No ambassadors assigned</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Overall Attendance Rate</p>
          {attendanceRate !== null && attendanceRate !== undefined ? (
            <p className={`text-lg font-semibold ${
              attendanceRate >= 80 ? "text-green-600" :
              attendanceRate >= 50 ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {attendanceRate}%
            </p>
          ) : (
            <p className="text-base text-muted-foreground">No confirmed sessions yet</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          To update club details, please contact your Regional Leader or Admin.
        </p>
      </CardContent>
    </Card>
  );
}
