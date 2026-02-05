import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinClubButton } from "./join-club-button";
import { MapPin, Users } from "lucide-react";

async function getClubs() {
  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select(`
      *,
      regions(name),
      club_ambassadors(
        is_primary,
        ambassador:users!club_ambassadors_ambassador_id_fkey(full_name)
      ),
      club_members(id)
    `)
    .order("name");

  return clubs || [];
}

async function getUserMembership(userId: string) {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, status")
    .eq("user_id", userId);
  return memberships || [];
}

export default async function BrowseClubsPage() {
  const user = await getCurrentUser();
  const [clubs, memberships] = await Promise.all([
    getClubs(),
    user ? getUserMembership(user.id) : [],
  ]);

  const membershipMap = new Map(memberships.map(m => [m.club_id, m.status]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Clubs</h1>
        <p className="text-muted-foreground">Find and join a startup club near you</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => {
          const memberCount = club.club_members?.length || 0;
          const membershipStatus = membershipMap.get(club.id);

          return (
            <Card key={club.id}>
              <CardHeader>
                <CardTitle>{club.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {(club.regions as { name: string } | null)?.name || "Unknown region"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {club.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {club.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    {memberCount} members
                  </div>
                  {user && (
                    <JoinClubButton
                      clubId={club.id}
                      userId={user.id}
                      status={membershipStatus}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Led by {(() => {
                    const ambassadors = club.club_ambassadors as Array<{
                      ambassador: { full_name: string } | null;
                    }> | null;
                    const names = ambassadors?.filter(a => a.ambassador).map(a => a.ambassador!.full_name) || [];
                    return names.length > 0 ? names.join(", ") : "Unknown";
                  })()}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {clubs.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No clubs found
          </p>
        )}
      </div>
    </div>
  );
}
