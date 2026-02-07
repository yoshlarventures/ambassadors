"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
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
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useState, Suspense } from "react";

const iconMap = {
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
} as const;

export type IconName = keyof typeof iconMap;

export interface SidebarSubItem {
  title: string;
  href: string;
}

export interface SidebarItem {
  title: string;
  href: string;
  icon: IconName;
  subItems?: SidebarSubItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
}

interface SidebarContentProps {
  items: SidebarItem[];
  isCollapsed: boolean;
}

function SidebarContent({ items, isCollapsed }: SidebarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand items that contain the current path
    const expanded = new Set<string>();
    items.forEach(item => {
      if (item.subItems && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
        expanded.add(item.href);
      }
    });
    return expanded;
  });

  // Build href with preserved search params for club-related pages
  const buildHref = (href: string) => {
    const clubId = searchParams.get("clubId");
    if (clubId && href.startsWith("/ambassador/my-club")) {
      return `${href}?clubId=${clubId}`;
    }
    return href;
  };

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Single unified layout that transitions smoothly
  return (
    <TooltipProvider delayDuration={0}>
      <nav className={cn(
        "grid gap-1 transition-all duration-300",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.has(item.href) && !isCollapsed;
          const itemActive = isActive(item.href);

          const buttonContent = (
            <Button
              variant={itemActive ? "secondary" : "ghost"}
              className={cn(
                "h-10 transition-all duration-300",
                isCollapsed
                  ? "w-10 justify-center px-0"
                  : "w-full justify-start px-3",
                itemActive && "bg-muted"
              )}
              onClick={hasSubItems && !isCollapsed ? () => toggleExpand(item.href) : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className={cn(
                "ml-3 truncate transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100"
              )}>
                {item.title}
              </span>
              {hasSubItems && !isCollapsed && (
                <span className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
            </Button>
          );

          return (
            <div key={item.href}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {hasSubItems ? (
                      <Link href={item.href}>{buttonContent}</Link>
                    ) : (
                      <Link href={item.href}>{buttonContent}</Link>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ) : hasSubItems ? (
                buttonContent
              ) : (
                <Link href={item.href}>{buttonContent}</Link>
              )}

              {/* Sub-items (only when expanded and not collapsed) */}
              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-4 overflow-hidden">
                  {item.subItems!.map((subItem) => (
                    <Link key={subItem.href} href={buildHref(subItem.href)}>
                      <Button
                        variant={pathname === subItem.href ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start",
                          pathname === subItem.href && "bg-muted"
                        )}
                      >
                        {subItem.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Check if we're on a learning page
  const isLearningPage = pathname.includes("/learning");

  // Sidebar is collapsed when on learning page and not hovered
  const isCollapsed = isLearningPage && !isHovered;

  return (
    <div
      className={cn(
        "hidden border-r bg-background md:block md:flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}
      onMouseEnter={() => isLearningPage && setIsHovered(true)}
      onMouseLeave={() => isLearningPage && setIsHovered(false)}
    >
      <div className="flex h-full flex-col">
        <div className={cn(
          "flex h-16 items-center border-b transition-all duration-300 overflow-hidden",
          isCollapsed ? "px-3 justify-center" : "px-4"
        )}>
          <div className={cn(
            "h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300",
            isCollapsed ? "opacity-100" : "opacity-0 w-0 h-0"
          )}>
            <span className="text-sm font-bold text-primary">
              {title.charAt(0)}
            </span>
          </div>
          <h2 className={cn(
            "text-lg font-semibold truncate transition-all duration-300",
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            {title}
          </h2>
        </div>
        <ScrollArea className="flex-1 py-4">
          <Suspense fallback={<div className="px-4">Loading...</div>}>
            <SidebarContent items={items} isCollapsed={isCollapsed} />
          </Suspense>
        </ScrollArea>
      </div>
    </div>
  );
}
