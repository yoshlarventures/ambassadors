import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/ambassador", icon: "LayoutDashboard" },
  {
    title: "My Club",
    href: "/ambassador/my-club",
    icon: "Building2",
    subItems: [
      { title: "Club Profile", href: "/ambassador/my-club" },
      { title: "Members", href: "/ambassador/my-club/members" },
      { title: "Sessions", href: "/ambassador/my-club/sessions" },
      { title: "Gallery", href: "/ambassador/my-club/gallery" },
    ],
  },
  { title: "Events", href: "/ambassador/events", icon: "Calendar" },
  { title: "Reports", href: "/ambassador/reports", icon: "FileText" },
  { title: "Resources", href: "/ambassador/resources", icon: "BookOpen" },
  { title: "Leaderboard", href: "/ambassador/leaderboard", icon: "Trophy" },
  { title: "Tasks", href: "/ambassador/tasks", icon: "ListTodo" },
];

export default async function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!["admin", "regional_leader", "ambassador"].includes(user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} sidebarItems={sidebarItems} />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} title="Ambassador" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
