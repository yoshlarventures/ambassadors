import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getMemberClub(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  return membership;
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

export default async function MemberGalleryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMemberClub(user.id);
  if (!membership) {
    redirect("/member/my-club");
  }

  const gallery = await getClubGallery(membership.club_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Club Gallery</h1>
        <p className="text-muted-foreground">Photos from club sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photos ({gallery.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {gallery.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No photos yet. Photos will appear here after sessions are confirmed.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((photo) => {
                const session = photo.session as { title: string; session_date: string } | null;
                return (
                  <div key={photo.id} className="space-y-2">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={photo.image_url}
                        alt={photo.caption || "Club photo"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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
