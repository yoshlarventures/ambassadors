import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersList } from "./members-list";
import { ClubSwitcher } from "../club-switcher";

async function getAmbassadorClubs(ambassadorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_ambassadors")
    .select("club_id, clubs(id, name)")
    .eq("ambassador_id", ambassadorId);
  return data || [];
}

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

interface PageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
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

  const members = await getClubMembers(clubId);

  const pendingMembers = members.filter(m => m.status === "pending");
  const approvedMembers = members.filter(m => m.status === "approved");
  const rejectedMembers = members.filter(m => m.status === "rejected");

  // Extract club options for the switcher
  const allClubs = clubs
    .map(c => c.clubs as unknown as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => c !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Club Members</h1>
          <p className="text-muted-foreground">Manage membership requests and members</p>
        </div>
        {allClubs.length > 1 && (
          <ClubSwitcher clubs={allClubs} currentClubId={clubId} />
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingMembers.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Members ({approvedMembers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <MembersList members={pendingMembers} clubId={clubId} currentUserId={user.id} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Members</CardTitle>
            </CardHeader>
            <CardContent>
              <MembersList members={approvedMembers} clubId={clubId} currentUserId={user.id} showRemove />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <MembersList members={rejectedMembers} clubId={clubId} currentUserId={user.id} showUndoReject />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
