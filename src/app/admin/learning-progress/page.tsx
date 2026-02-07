import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Crown, Users } from "lucide-react";
import { AdminProgressList } from "./admin-progress-list";

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

interface Region {
  id: string;
  name: string;
}

async function getLeads(): Promise<User[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exode_user_id, exode_course_points, exode_points_synced_at, region_id, regions(name)")
    .eq("role", "regional_leader")
    .order("full_name");

  return (data || []).map((user) => {
    const region = user.regions as unknown as { name: string } | null;
    return {
      ...user,
      region_name: region?.name || null,
    };
  });
}

async function getAmbassadorsByRegion(): Promise<{ region: Region; ambassadors: User[] }[]> {
  const supabase = await createClient();

  const { data: regions } = await supabase
    .from("regions")
    .select("id, name")
    .order("name");

  const { data: ambassadors } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exode_user_id, exode_course_points, exode_points_synced_at, region_id")
    .eq("role", "ambassador")
    .order("full_name");

  if (!regions) return [];

  const result = regions.map((region) => ({
    region,
    ambassadors: (ambassadors || [])
      .filter((a) => a.region_id === region.id)
      .map((a) => ({ ...a, region_name: region.name })),
  }));

  // Also add unassigned ambassadors
  const unassigned = (ambassadors || []).filter((a) => !a.region_id);
  if (unassigned.length > 0) {
    result.push({
      region: { id: "unassigned", name: "Unassigned" },
      ambassadors: unassigned.map((a) => ({ ...a, region_name: null })),
    });
  }

  return result;
}

export default async function AdminLearningProgressPage() {
  const [leads, ambassadorsByRegion] = await Promise.all([
    getLeads(),
    getAmbassadorsByRegion(),
  ]);

  const totalAmbassadors = ambassadorsByRegion.reduce((sum, r) => sum + r.ambassadors.length, 0);
  const linkedLeads = leads.filter((l) => l.exode_user_id).length;
  const linkedAmbassadors = ambassadorsByRegion.reduce(
    (sum, r) => sum + r.ambassadors.filter((a) => a.exode_user_id).length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Progress</h1>
        <p className="text-muted-foreground">Track learning progress of all leads and ambassadors</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Regional Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedLeads} / {leads.length}</div>
            <p className="text-xs text-muted-foreground">have linked Exode accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ambassadors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedAmbassadors} / {totalAmbassadors}</div>
            <p className="text-xs text-muted-foreground">have linked Exode accounts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <Crown className="h-4 w-4" />
            Regional Leaders ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-2">
            <Users className="h-4 w-4" />
            Ambassadors ({totalAmbassadors})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Regional Leaders Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No regional leaders found.</p>
              ) : (
                <AdminProgressList users={leads} showRegion={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambassadors">
          <div className="space-y-6">
            {ambassadorsByRegion.map(({ region, ambassadors }) => (
              <Card key={region.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {region.name}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {ambassadors.filter((a) => a.exode_user_id).length} / {ambassadors.length} linked
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ambassadors.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No ambassadors in this region.</p>
                  ) : (
                    <AdminProgressList users={ambassadors} showRegion={false} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
