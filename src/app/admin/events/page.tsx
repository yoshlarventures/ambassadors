import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicEventsSection } from "@/components/events/public-events-section";
import { OrganizerEventsSection } from "@/components/events/organizer-events-section";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { AdminEventsList } from "./admin-events-list";

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

  // Pass all approved events to client - filtering will happen there based on user's local time
  const upcomingEvents = approvedEvents || [];

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
    upcoming: upcomingEvents,
    past: pastEvents || [],
  };
}

async function getOrganizerEvents(userId: string) {
  const supabase = await createClient();

  // Get events where user is organizer
  const { data: organizerEvents } = await supabase
    .from("events")
    .select(`
      *,
      regions(name),
      organizer:users!events_organizer_id_fkey(full_name),
      event_collaborators(user_id, user:users(full_name)),
      event_photos(id, image_url)
    `)
    .eq("organizer_id", userId)
    .order("event_date", { ascending: false });

  // Get event IDs where user is a collaborator
  const { data: collaborations } = await supabase
    .from("event_collaborators")
    .select("event_id")
    .eq("user_id", userId);

  const collabEventIds = (collaborations || []).map(c => c.event_id);

  // Get collaborator events (excluding ones already fetched as organizer)
  let collabEvents: typeof organizerEvents = [];
  if (collabEventIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        regions(name),
        organizer:users!events_organizer_id_fkey(full_name),
        event_collaborators(user_id, user:users(full_name)),
        event_photos(id, image_url)
      `)
      .in("id", collabEventIds)
      .neq("organizer_id", userId)
      .order("event_date", { ascending: false });
    collabEvents = data || [];
  }

  // Combine and sort all events
  const allEvents = [...(organizerEvents || []), ...collabEvents];
  allEvents.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return allEvents;
}

async function getAllEventsForApproval() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      regions(name),
      organizer:users!events_organizer_id_fkey(full_name, email),
      event_collaborators(user:users(full_name)),
      event_photos(id, image_url)
    `)
    .order("created_at", { ascending: false });
  return events || [];
}

async function getRegions() {
  const supabase = await createClient();
  const { data } = await supabase.from("regions").select("id, name, name_uz, created_at").order("name");
  return data || [];
}

async function getAmbassadors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name")
    .in("role", ["ambassador", "regional_leader"]);
  return data || [];
}

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [publicEvents, organizerEvents, allEvents, regions, ambassadors] = await Promise.all([
    getPublicEvents(),
    getOrganizerEvents(user.id),
    getAllEventsForApproval(),
    getRegions(),
    getAmbassadors(),
  ]);

  // Filter events for approval dashboard
  const pending = allEvents.filter(e => e.status === "pending_approval");
  const approved = allEvents.filter(e => e.status === "approved");
  const completed = allEvents.filter(e => e.status === "completed");
  const rejected = allEvents.filter(e => e.status === "rejected");
  const cancelled = allEvents.filter(e => e.status === "cancelled");

  // Check if admin has any organizer events
  const hasOrganizerEvents = organizerEvents.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Manage and approve events</p>
        </div>
        <CreateEventDialog
          userId={user.id}
          userRegionId={user.region_id}
          regions={regions}
          ambassadors={ambassadors.filter(a => a.id !== user.id)}
          isAdmin
        />
      </div>

      {/* Public Events Section */}
      <PublicEventsSection
        upcomingEvents={publicEvents.upcoming}
        pastEvents={publicEvents.past}
        regions={regions}
        title="Public Events"
      />

      {/* Organizer Events Section (only show if admin has created/collaborated on events) */}
      {hasOrganizerEvents && (
        <OrganizerEventsSection
          events={organizerEvents}
          userId={user.id}
          title="My Events"
        />
      )}

      {/* Approval Dashboard Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Approval Dashboard</h2>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEventsList events={pending} regions={regions} showApprovalActions />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Events</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEventsList events={approved} regions={regions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Events</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEventsList events={completed} regions={regions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Events</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEventsList events={rejected} regions={regions} showRejectionReason />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Events</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEventsList events={cancelled} regions={regions} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
