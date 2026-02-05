import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubSwitcher } from "../club-switcher";

async function getAmbassadorClubs(ambassadorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_ambassadors")
    .select("club_id, clubs(id, name)")
    .eq("ambassador_id", ambassadorId);
  return data || [];
}

async function getClubGallery(clubId: string) {
  const supabase = await createClient();
  const { data: gallery } = await supabase
    .from("club_gallery")
    .select("*, session:sessions(title, session_date)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return gallery || [];
}

interface PageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function GalleryPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const clubs = await getAmbassadorClubs(user.id);

  if (clubs.length === 0) {
    redirect("/ambassador/my-club");
  }

  // Use clubId from URL or default to first club
  const clubId = params.clubId && clubs.some(c => c.club_id === params.clubId)
    ? params.clubId
    : clubs[0].club_id;

  const gallery = await getClubGallery(clubId);

  // Extract club options for the switcher
  const allClubs = clubs
    .map(c => c.clubs as unknown as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => c !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Club Gallery</h1>
          <p className="text-muted-foreground">Photos from your club sessions and events</p>
        </div>
        {allClubs.length > 1 && (
          <ClubSwitcher clubs={allClubs} currentClubId={clubId} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photos ({gallery.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {gallery.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No photos yet. Photos will appear here after you confirm sessions with images.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((photo) => {
                const session = photo.session as { title: string; session_date: string } | null;
                return (
                  <div key={photo.id} className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt={photo.caption || "Club photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {session && (
                      <div className="px-1">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.session_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
