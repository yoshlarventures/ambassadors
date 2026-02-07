import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LearningControlsProvider } from "@/components/learning/learning-controls-context";

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
  { title: "Tasks", href: "/lead/tasks", icon: "ListTodo" },
  {
    title: "Learning",
    href: "/lead/learning",
    icon: "GraduationCap",
    subItems: [
      { title: "My Learning", href: "/lead/learning" },
      { title: "Ambassador Progress", href: "/lead/learning-progress" },
    ],
  },
  { title: "Leaderboard", href: "/lead/leaderboard", icon: "Trophy" },
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
    <LearningControlsProvider>
      <div className="flex min-h-screen flex-col">
        <Header user={user} sidebarItems={sidebarItems} />
        <div className="flex flex-1">
          <Sidebar items={sidebarItems} title="Regional Leader" />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </LearningControlsProvider>
  );
}
