import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminMembersList } from "./admin-members-list";

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
            <AdminMembersList members={approvedMembers} emptyMessage="No members found" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminMembersList members={pendingMembers} emptyMessage="No pending requests" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rejected">
        <Card>
          <CardHeader>
            <CardTitle>Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminMembersList members={rejectedMembers} emptyMessage="No rejected requests" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
