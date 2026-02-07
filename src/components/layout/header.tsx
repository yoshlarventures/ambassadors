"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trophy,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  LayoutDashboard,
  Users,
  MapPin,
  Building2,
  Calendar,
  FileText,
  BookOpen,
  ListTodo,
  BarChart3,
  Image as ImageIcon,
  GraduationCap,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Unlink,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarItem, IconName } from "./sidebar";
import { toast } from "sonner";
import { useLearningControls } from "@/components/learning/learning-controls-context";

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  MapPin,
  Building2,
  Calendar,
  FileText,
  BookOpen,
  ListTodo,
  BarChart3,
  Trophy,
  ImageIcon,
  GraduationCap,
};

interface HeaderProps {
  user: User;
  sidebarItems?: SidebarItem[];
}

export function Header({ user, sidebarItems }: HeaderProps) {
  const router = useRouter();
  const { controls: learningControls } = useLearningControls();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Mobile menu */}
      {sidebarItems && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">Ambassadors</span>
              </Link>
            </div>
            <nav className="grid gap-1 p-4">
              {sidebarItems.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-auto">
        <Trophy className="h-5 w-5" />
        <span className="font-semibold hidden sm:inline">Startup Ambassadors</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Learning controls - shown when on learning page */}
        {learningControls && (
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center gap-1 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={learningControls.onRefresh}
                    disabled={learningControls.isLoading}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={`h-4 w-4 ${learningControls.isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={learningControls.onToggleFullscreen}
                    className="h-8 w-8"
                  >
                    {learningControls.isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {learningControls.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>

              {learningControls.iframeUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={learningControls.onOpenNewTab}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
              )}

              <div className="w-px h-5 bg-border mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={learningControls.onUnlink}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Unlink account</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
