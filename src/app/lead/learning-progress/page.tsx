import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { AmbassadorProgressList } from "./ambassador-progress-list";

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, region_id")
    .eq("id", user.id)
    .single();

  return profile;
}

async function getRegionalAmbassadors(regionId: string) {
  const supabase = await createClient();

  const { data: ambassadors } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exode_user_id, exode_course_points, exode_points_synced_at")
    .eq("role", "ambassador")
    .eq("region_id", regionId)
    .order("full_name");

  return ambassadors || [];
}

export default async function LearningProgressPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader") {
    redirect("/");
  }

  if (!user.region_id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Learning Progress</h1>
          <p className="text-muted-foreground">Track your ambassadors&apos; course progress</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              No region assigned. Please contact admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ambassadors = await getRegionalAmbassadors(user.region_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Progress</h1>
        <p className="text-muted-foreground">Track your ambassadors&apos; course progress</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Ambassadors Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ambassadors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No ambassadors in your region yet.
            </p>
          ) : (
            <AmbassadorProgressList ambassadors={ambassadors} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
