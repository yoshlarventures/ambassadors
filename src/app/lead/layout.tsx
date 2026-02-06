import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/lead", icon: "LayoutDashboard" },
  { title: "Ambassadors", href: "/lead/ambassadors", icon: "Users" },
  { title: "Clubs", href: "/lead/clubs", icon: "Building2" },
  { title: "Events", href: "/lead/events", icon: "Calendar" },
  {
    title: "Reports",
    href: "/lead/reports",
    icon: "FileText",
    subItems: [
      { title: "Overview", href: "/lead/reports/overview" },
      { title: "Pending Review", href: "/lead/reports" },
    ],
  },
  { title: "Resources", href: "/lead/resources", icon: "BookOpen" },
];

export default async function LeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!["admin", "regional_leader"].includes(user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} sidebarItems={sidebarItems} />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} title="Regional Leader" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
