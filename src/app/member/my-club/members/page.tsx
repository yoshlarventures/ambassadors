import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

async function getClubMembers(clubId: string, currentUserId: string) {
  const supabase = await createClient();

  // Get all approved members
  const { data: members } = await supabase
    .from("club_members")
    .select("*, users!club_members_user_id_fkey(id, full_name, email, avatar_url)")
    .eq("club_id", clubId)
    .eq("status", "approved")
    .order("joined_at", { ascending: true });

  // Get ambassadors
  const { data: ambassadors } = await supabase
    .from("club_ambassadors")
    .select("*, ambassador:users!club_ambassadors_ambassador_id_fkey(id, full_name, email, avatar_url)")
    .eq("club_id", clubId);

  return { members: members || [], ambassadors: ambassadors || [], currentUserId };
}

export default async function MemberClubMembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMemberClub(user.id);
  if (!membership) {
    redirect("/member/my-club");
  }

  const { members, ambassadors, currentUserId } = await getClubMembers(membership.club_id, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Club Members</h1>
        <p className="text-muted-foreground">People in your club</p>
      </div>

      {/* Ambassadors */}
      <Card>
        <CardHeader>
          <CardTitle>Ambassadors</CardTitle>
        </CardHeader>
        <CardContent>
          {ambassadors.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No ambassadors assigned</p>
          ) : (
            <div className="space-y-3">
              {ambassadors.map((amb) => {
                const ambassador = amb.ambassador as { id: string; full_name: string; email: string; avatar_url: string | null } | null;
                if (!ambassador) return null;

                const initials = ambassador.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={amb.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={ambassador.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{ambassador.full_name}</div>
                      <div className="text-sm text-muted-foreground">{ambassador.email}</div>
                    </div>
                    <Badge variant="secondary">Ambassador</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No members yet</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const memberUser = member.users as { id: string; full_name: string; email: string; avatar_url: string | null } | null;
                if (!memberUser) return null;

                const initials = memberUser.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isCurrentUser = memberUser.id === currentUserId;

                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={memberUser.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {memberUser.full_name}
                        {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Member since {new Date(member.joined_at!).toLocaleDateString()}
                      </div>
                    </div>
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
