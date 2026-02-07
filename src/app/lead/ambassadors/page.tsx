import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

async function getRegionAmbassadors(regionId: string) {
  const supabase = await createClient();

  // First get ambassadors in the region
  const { data: ambassadors, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, avatar_url, created_at")
    .eq("region_id", regionId)
    .eq("role", "ambassador")
    .order("full_name");

  if (error) {
    console.error("Error fetching ambassadors:", error);
    return [];
  }

  if (!ambassadors || ambassadors.length === 0) {
    return [];
  }

  // Get clubs for each ambassador through club_ambassadors junction table
  const ambassadorIds = ambassadors.map(a => a.id);
  const { data: clubAmbassadors } = await supabase
    .from("club_ambassadors")
    .select("ambassador_id, clubs(id, name)")
    .in("ambassador_id", ambassadorIds);

  // Map clubs to ambassadors (multiple clubs per ambassador)
  const clubMap = new Map<string, { id: string; name: string }[]>();
  clubAmbassadors?.forEach((ca) => {
    // clubs is a single object since club_ambassadors has FK to clubs
    const club = ca.clubs as unknown as { id: string; name: string } | null;
    if (club) {
      const existing = clubMap.get(ca.ambassador_id) || [];
      existing.push(club);
      clubMap.set(ca.ambassador_id, existing);
    }
  });

  // Attach clubs info to each ambassador
  return ambassadors.map(ambassador => ({
    ...ambassador,
    clubs: clubMap.get(ambassador.id) || []
  }));
}

export default async function LeadAmbassadorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.region_id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ambassadors</h1>
          <p className="text-muted-foreground">View ambassadors in your region</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You need to be assigned to a region to view ambassadors.
          </CardContent>
        </Card>
      </div>
    );
  }

  const ambassadors = await getRegionAmbassadors(user.region_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ambassadors</h1>
        <p className="text-muted-foreground">Ambassadors in your region</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ambassadors ({ambassadors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassador</TableHead>
                <TableHead>Clubs</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ambassadors.map((ambassador) => {
                const initials = ambassador.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const clubs = ambassador.clubs as { id: string; name: string }[];

                return (
                  <TableRow key={ambassador.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ambassador.avatar_url || undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{ambassador.full_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {clubs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {clubs.map((club) => (
                            <Badge key={club.id} variant="outline">{club.name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No club</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{ambassador.email}</div>
                        {ambassador.phone && (
                          <div className="text-muted-foreground">{ambassador.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(ambassador.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {ambassadors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No ambassadors in your region
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
