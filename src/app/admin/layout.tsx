import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "Users", href: "/admin/users", icon: "Users" },
  { title: "Regions", href: "/admin/regions", icon: "MapPin" },
  { title: "Clubs", href: "/admin/clubs", icon: "Building2" },
  { title: "Events", href: "/admin/events", icon: "Calendar" },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: "FileText",
    subItems: [
      { title: "Overview", href: "/admin/reports/overview" },
      { title: "All Reports", href: "/admin/reports" },
    ],
  },
  { title: "Resources", href: "/admin/resources", icon: "BookOpen" },
  { title: "Tasks", href: "/admin/tasks", icon: "ListTodo" },
  { title: "Insights", href: "/admin/insights", icon: "BarChart3" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} sidebarItems={sidebarItems} />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} title="Admin Panel" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
