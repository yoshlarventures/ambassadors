import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getClubGallery(clubId: string) {
  const supabase = await createClient();
  const { data: gallery } = await supabase
    .from("club_gallery")
    .select("*, session:sessions(title, session_date)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return gallery || [];
}

export default async function AdminClubGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gallery = await getClubGallery(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos ({gallery.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {gallery.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No photos yet.
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
  );
}
