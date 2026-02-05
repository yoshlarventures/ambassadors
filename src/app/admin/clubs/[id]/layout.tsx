import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getClub(clubId: string) {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("id", clubId)
    .single();
  return club;
}

const tabs = [
  { name: "Profile", href: "" },
  { name: "Members", href: "/members" },
  { name: "Sessions", href: "/sessions" },
  { name: "Gallery", href: "/gallery" },
];

export default async function AdminClubDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/unauthorized");

  const { id } = await params;
  const club = await getClub(id);

  if (!club) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clubs">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Clubs
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{club.name}</h1>
        <p className="text-muted-foreground">View club details</p>
      </div>

      <nav className="flex space-x-4 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={`/admin/clubs/${id}${tab.href}`}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              "hover:text-foreground hover:border-muted-foreground",
              "border-transparent text-muted-foreground"
            )}
          >
            {tab.name}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
