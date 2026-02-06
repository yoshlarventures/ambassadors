import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsOverviewTable } from "./reports-overview-table";
import { SessionSnapshot, EventSnapshot, MemberSnapshot, PointSnapshot } from "@/types";

interface AmbassadorWithClubs {
  id: string;
  full_name: string;
  region_id: string;
  region_name: string;
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

async function getAmbassadorsWithReports(year: number) {
  const supabase = await createClient();

  // Get all ambassadors with their regions
  const { data: ambassadors } = await supabase
    .from("users")
    .select("id, full_name, region_id, regions(name)")
    .eq("role", "ambassador")
    .order("full_name");

  if (!ambassadors || ambassadors.length === 0) {
    return { ambassadors: [], reports: [], regions: [] };
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

  // Get all reports for the year with full data
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id, ambassador_id, month, year, status,
      sessions_count, total_attendance, events_count, events_attendance,
      new_members_count, points_earned, attendance_rate,
      highlights, challenges, goals,
      sessions_data, events_data, members_data, points_data
    `)
    .eq("year", year);

  // Build ambassadors list with clubs
  const ambassadorsWithClubs: AmbassadorWithClubs[] = ambassadors.map(a => ({
    id: a.id,
    full_name: a.full_name,
    region_id: a.region_id || "",
    region_name: (a.regions as unknown as { name: string } | null)?.name || "No Region",
    clubs: ambassadorClubsMap.get(a.id) || [],
  }));

  // Get unique regions
  const regionsMap = new Map<string, string>();
  ambassadorsWithClubs.forEach(a => {
    if (a.region_id) {
      regionsMap.set(a.region_id, a.region_name);
    }
  });
  const regions = Array.from(regionsMap.entries()).map(([id, name]) => ({ id, name }));
  regions.sort((a, b) => a.name.localeCompare(b.name));

  // Add "No Region" at the end if there are ambassadors without region
  if (ambassadorsWithClubs.some(a => !a.region_id)) {
    regions.push({ id: "", name: "No Region" });
  }

  return {
    ambassadors: ambassadorsWithClubs,
    reports: (reports || []) as ReportStatus[],
    regions,
  };
}

export default async function AdminReportsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year) : currentYear;

  const { ambassadors, reports, regions } = await getAmbassadorsWithReports(year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Overview</h1>
        <p className="text-muted-foreground">
          View report status for all ambassadors by month
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {year} Reports Status ({ambassadors.length} ambassadors)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsOverviewTable
            ambassadors={ambassadors}
            reports={reports}
            regions={regions}
            year={year}
            currentYear={currentYear}
          />
        </CardContent>
      </Card>
    </div>
  );
}
