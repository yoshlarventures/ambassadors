import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { EventsTabs } from "./events-tabs";

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
    approved: approvedEvents || [],
    past: pastEvents || [],
  };
}

async function getRegions() {
  const supabase = await createClient();
  const { data } = await supabase.from("regions").select("id, name").order("name");
  return data || [];
}

export default async function PublicEventsPage() {
  const [user, { approved: approvedEvents, past: pastEvents }, regions] = await Promise.all([
    getCurrentUser(),
    getPublicEvents(),
    getRegions(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="font-semibold text-lg">Startup Ambassadors</span>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Discover and join startup events across Uzbekistan
          </p>
        </div>

        <EventsTabs
          approvedEvents={approvedEvents}
          pastEvents={pastEvents}
          regions={regions}
        />
      </main>
    </div>
  );
}
