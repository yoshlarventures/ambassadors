import { UserRole } from "@/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  regional_leader: 3,
  ambassador: 2,
  member: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  regional_leader: "Regional Leader",
  ambassador: "Ambassador",
  member: "Member",
};

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  regional_leader: "/lead",
  ambassador: "/ambassador",
  member: "/member",
};

export const PROTECTED_ROUTES = {
  admin: ["/admin"],
  regional_leader: ["/lead"],
  ambassador: ["/ambassador"],
  member: ["/member"],
};

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  const role = userRole as string;

  // Admin can access everything
  if (role === "admin") return true;

  // Check specific route access
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/lead")) return ["admin", "regional_leader"].includes(role);
  if (pathname.startsWith("/ambassador")) return ["admin", "regional_leader", "ambassador"].includes(role);
  if (pathname.startsWith("/member")) return true; // All authenticated users

  return true;
}

export function getDefaultRoute(role: UserRole): string {
  return ROLE_ROUTES[role] || "/member";
}
