import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/member", icon: "LayoutDashboard" },
  { title: "Browse Clubs", href: "/member/clubs", icon: "Building2" },
  {
    title: "My Club",
    href: "/member/my-club",
    icon: "Building2",
    subItems: [
      { title: "Club Profile", href: "/member/my-club" },
      { title: "Members", href: "/member/my-club/members" },
      { title: "Sessions", href: "/member/my-club/sessions" },
      { title: "Gallery", href: "/member/my-club/gallery" },
    ],
  },
  { title: "Events", href: "/member/events", icon: "Calendar" },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} sidebarItems={sidebarItems} />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} title="Member" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
