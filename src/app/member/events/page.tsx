import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { PublicEventsSection } from "@/components/events/public-events-section";

async function getPublicEvents() {
  const supabase = await createClient();
  // Use yesterday to account for timezone differences between server and client
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get approved events (filtering by start_time happens on client)
  const { data: approvedEvents } = await supabase
    .from("events")
    .select(`
      *,
      regions(name),
      organizer:users!events_organizer_id_fkey(full_name),
      event_collaborators(user:users(full_name))
    `)
    .eq("status", "approved")
    .gte("event_date", yesterday)
    .order("event_date", { ascending: true });

  // Get completed events (for Past tab)
  const { data: pastEvents } = await supabase
    .from("events")
    .select(`
      *,
      regions(name),
      organizer:users!events_organizer_id_fkey(full_name),
      event_collaborators(user:users(full_name)),
      event_photos(id, image_url)
    `)
    .eq("status", "completed")
    .order("event_date", { ascending: false });

  return {
    upcoming: approvedEvents || [],
    past: pastEvents || [],
  };
}

async function getRegions() {
  const supabase = await createClient();
  const { data } = await supabase.from("regions").select("id, name").order("name");
  return data || [];
}

export default async function MemberEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ upcoming: upcomingEvents, past: pastEvents }, regions] = await Promise.all([
    getPublicEvents(),
    getRegions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground">Discover and join startup events</p>
      </div>

      <PublicEventsSection
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        regions={regions}
        title="Events"
      />
    </div>
  );
}
