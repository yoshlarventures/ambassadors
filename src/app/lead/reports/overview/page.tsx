import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadReportsOverviewTable } from "./lead-reports-overview-table";
import { SessionSnapshot, EventSnapshot, MemberSnapshot, PointSnapshot } from "@/types";

interface AmbassadorWithClubs {
  id: string;
  full_name: string;
  clubs: string[];
}

interface ReportStatus {
  ambassador_id: string;
  month: number;
  year: number;
  status: string;
  id: string;
  sessions_count: number;
  total_attendance: number;
  events_count: number;
  events_attendance: number;
  new_members_count: number;
  points_earned: number;
  attendance_rate: number | null;
  highlights: string | null;
  challenges: string | null;
  goals: string | null;
  sessions_data: SessionSnapshot[] | null;
  events_data: EventSnapshot[] | null;
  members_data: MemberSnapshot[] | null;
  points_data: PointSnapshot[] | null;
}

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

async function getRegionAmbassadorsWithReports(regionId: string, year: number) {
  const supabase = await createClient();

  // Get ambassadors in this region
  const { data: ambassadors } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "ambassador")
    .eq("region_id", regionId)
    .order("full_name");

  if (!ambassadors || ambassadors.length === 0) {
    return { ambassadors: [], reports: [] };
  }

  // Get clubs for each ambassador
  const ambassadorIds = ambassadors.map(a => a.id);
  const { data: clubAmbassadors } = await supabase
    .from("club_ambassadors")
    .select("ambassador_id, clubs(name)")
    .in("ambassador_id", ambassadorIds);

  // Map ambassador_id to their clubs
  const ambassadorClubsMap = new Map<string, string[]>();
  clubAmbassadors?.forEach((ca) => {
    const club = ca.clubs as unknown as { name: string } | null;
    if (club) {
      const existing = ambassadorClubsMap.get(ca.ambassador_id) || [];
      existing.push(club.name);
      ambassadorClubsMap.set(ca.ambassador_id, existing);
    }
  });

  // Get all reports for the year for these ambassadors with full data
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id, ambassador_id, month, year, status,
      sessions_count, total_attendance, events_count, events_attendance,
      new_members_count, points_earned, attendance_rate,
      highlights, challenges, goals,
      sessions_data, events_data, members_data, points_data
    `)
    .eq("year", year)
    .in("ambassador_id", ambassadorIds);

  // Build ambassadors list with clubs
  const ambassadorsWithClubs: AmbassadorWithClubs[] = ambassadors.map(a => ({
    id: a.id,
    full_name: a.full_name,
    clubs: ambassadorClubsMap.get(a.id) || [],
  }));

  return {
    ambassadors: ambassadorsWithClubs,
    reports: (reports || []) as ReportStatus[],
  };
}

export default async function LeadReportsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "regional_leader" || !user.region_id) {
    redirect("/");
  }

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year) : currentYear;

  const { ambassadors, reports } = await getRegionAmbassadorsWithReports(user.region_id, year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Overview</h1>
        <p className="text-muted-foreground">
          View report status for ambassadors in your region by month
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {year} Reports Status ({ambassadors.length} ambassadors)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadReportsOverviewTable
            ambassadors={ambassadors}
            reports={reports}
            year={year}
            currentYear={currentYear}
          />
        </CardContent>
      </Card>
    </div>
  );
}
