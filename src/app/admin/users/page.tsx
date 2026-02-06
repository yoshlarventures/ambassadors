import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserDialog } from "./create-user-dialog";
import { UsersList } from "./users-list";
import { Region } from "@/types";

async function getUsers() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*, regions(name)")
    .order("created_at", { ascending: false });
  return users || [];
}

async function getRegions() {
  const supabase = await createClient();
  const { data: regions } = await supabase.from("regions").select("*").order("name");
  return (regions || []) as Region[];
}

export default async function UsersPage() {
  const [users, regions] = await Promise.all([getUsers(), getRegions()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <CreateUserDialog regions={regions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList users={users} regions={regions} />
        </CardContent>
      </Card>
    </div>
  );
}
