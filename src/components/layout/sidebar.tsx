"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function SidebarContent({ items }: { items: SidebarItem[] }) {
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

  return (
    <nav className="grid gap-1 px-4">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.has(item.href);
        const itemActive = isActive(item.href);

        if (hasSubItems) {
          return (
            <div key={item.href}>
              <Button
                variant={itemActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-between",
                  itemActive && "bg-muted"
                )}
                onClick={() => toggleExpand(item.href)}
              >
                <span className="flex items-center">
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-4">
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
        }

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={itemActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                itemActive && "bg-muted"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <div className="hidden border-r bg-background md:block md:w-64 md:flex-shrink-0">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <ScrollArea className="flex-1 py-4">
          <Suspense fallback={<div className="px-4">Loading...</div>}>
            <SidebarContent items={items} />
          </Suspense>
        </ScrollArea>
      </div>
    </div>
  );
}
