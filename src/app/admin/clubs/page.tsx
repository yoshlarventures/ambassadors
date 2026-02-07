import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClubDialog, AmbassadorOption } from "@/components/clubs/create-club-dialog";
import { ClubsList } from "./clubs-list";
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
    .select("id, name, name_uz, created_at")
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
          <ClubsList
            clubs={clubs}
            regions={regions}
            ambassadors={ambassadors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
