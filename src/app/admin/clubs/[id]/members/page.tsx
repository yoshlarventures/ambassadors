import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getClubMembers(clubId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("club_members")
    .select("*, users!club_members_user_id_fkey(id, full_name, email, avatar_url)")
    .eq("club_id", clubId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  return members || [];
}

function MemberCard({ member }: { member: { users: { full_name: string; email: string; avatar_url: string | null } | null; joined_at: string | null } }) {
  const user = member.users;
  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.full_name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>
      {member.joined_at && (
        <div className="text-sm text-muted-foreground">
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default async function AdminClubMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const members = await getClubMembers(id);

  const pendingMembers = members.filter(m => m.status === "pending");
  const approvedMembers = members.filter(m => m.status === "approved");
  const rejectedMembers = members.filter(m => m.status === "rejected");

  return (
    <Tabs defaultValue="approved" className="space-y-4">
      <TabsList>
        <TabsTrigger value="approved">
          Members ({approvedMembers.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pendingMembers.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedMembers.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="approved">
        <Card>
          <CardHeader>
            <CardTitle>Approved Members</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No members found</p>
            ) : (
              <div className="space-y-4">
                {approvedMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rejected">
        <Card>
          <CardHeader>
            <CardTitle>Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {rejectedMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rejected requests</p>
            ) : (
              <div className="space-y-4">
                {rejectedMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
