import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateClubDialog, AmbassadorOption } from "@/components/clubs/create-club-dialog";
import { ClubActions } from "@/components/clubs/club-actions";
import { Region } from "@/types";

async function getClubs() {
  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select(`
      *,
      club_ambassadors(
        id,
        ambassador_id,
        is_primary,
        ambassador:users!club_ambassadors_ambassador_id_fkey(full_name, email, avatar_url)
      ),
      regions(name),
      club_members(id, status),
      sessions(id, session_date, start_time, is_confirmed)
    `)
    .order("created_at", { ascending: false });
  return clubs || [];
}

async function getRegions() {
  const supabase = await createClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("*")
    .order("name");
  return (regions || []) as Region[];
}

async function getAmbassadors() {
  const supabase = await createClient();

  // Get all ambassadors
  const { data: ambassadors } = await supabase
    .from("users")
    .select("id, full_name, email, region_id")
    .eq("role", "ambassador")
    .order("full_name");

  // Get all club ambassador assignments
  const { data: assignments } = await supabase
    .from("club_ambassadors")
    .select("ambassador_id");

  const ambassadorIdsWithClubs = new Set(
    (assignments || []).map((a) => a.ambassador_id)
  );

  return (ambassadors || []).map((amb) => ({
    ...amb,
    has_club: ambassadorIdsWithClubs.has(amb.id),
  })) as AmbassadorOption[];
}

export default async function AdminClubsPage() {
  const [clubs, regions, ambassadors] = await Promise.all([
    getClubs(),
    getRegions(),
    getAmbassadors(),
  ]);

  const now = new Date();
  // Use local date, not UTC (toISOString gives UTC)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5);

  // Helper to check if session is past
  const isSessionPast = (session: { session_date: string; start_time: string }) => {
    if (session.session_date < today) return true;
    if (session.session_date === today && session.start_time.slice(0, 5) <= currentTime) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clubs</h1>
          <p className="text-muted-foreground">Manage all startup clubs</p>
        </div>
        <CreateClubDialog
          regions={regions}
          ambassadors={ambassadors}
          userRole="admin"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clubs ({clubs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Ambassadors</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.map((club) => {
                const clubAmbassadors = (club.club_ambassadors || []) as Array<{
                  id: string;
                  ambassador_id: string;
                  ambassador: { full_name: string; email: string; avatar_url: string | null } | null;
                }>;

                const approvedMembers = club.club_members?.filter(
                  (m: { status: string }) => m.status === "approved"
                ).length || 0;

                const pastSessionsCount = club.sessions?.filter(
                  (s: { session_date: string; start_time: string; is_confirmed: boolean }) =>
                    isSessionPast(s) && s.is_confirmed
                ).length || 0;

                return (
                  <TableRow key={club.id}>
                    <TableCell>
                      <Link href={`/admin/clubs/${club.id}`} className="block hover:underline">
                        <div className="font-medium">{club.name}</div>
                        {club.address && (
                          <div className="text-sm text-muted-foreground">{club.address}</div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {clubAmbassadors.map((ca) => {
                          const amb = ca.ambassador;
                          if (!amb) return null;
                          const initials = amb.full_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                          return (
                            <div key={ca.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={amb.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{amb.full_name}</span>
                            </div>
                          );
                        })}
                        {clubAmbassadors.length === 0 && (
                          <span className="text-sm text-muted-foreground">No ambassadors</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(club.regions as { name: string } | null)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{approvedMembers}</TableCell>
                    <TableCell>{pastSessionsCount}</TableCell>
                    <TableCell>
                      {new Date(club.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ClubActions
                        club={{
                          ...club,
                          club_ambassadors: clubAmbassadors,
                        }}
                        regions={regions}
                        ambassadors={ambassadors}
                        userRole="admin"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {clubs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No clubs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
