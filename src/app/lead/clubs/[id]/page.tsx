import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getClub(clubId: string) {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("*, regions(name, name_uz)")
    .eq("id", clubId)
    .single();
  return club;
}

async function getClubAmbassadors(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_ambassadors")
    .select("ambassador:users!club_ambassadors_ambassador_id_fkey(id, full_name, email, avatar_url)")
    .eq("club_id", clubId);
  return (data || [])
    .map(d => d.ambassador as unknown as { id: string; full_name: string; email: string; avatar_url: string | null } | null)
    .filter((a): a is { id: string; full_name: string; email: string; avatar_url: string | null } => a !== null);
}

async function getClubAttendanceRate(clubId: string) {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("attendance_rate")
    .eq("club_id", clubId)
    .eq("is_confirmed", true)
    .not("attendance_rate", "is", null);

  if (!sessions || sessions.length === 0) return null;

  const totalRate = sessions.reduce((sum, s) => sum + (s.attendance_rate || 0), 0);
  return Math.round(totalRate / sessions.length);
}

export default async function LeadClubProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [club, ambassadors, attendanceRate] = await Promise.all([
    getClub(id),
    getClubAmbassadors(id),
    getClubAttendanceRate(id),
  ]);

  if (!club) {
    notFound();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Club Profile</CardTitle>
        <CardDescription>Club information</CardDescription>
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

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p className="text-base">{new Date(club.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
