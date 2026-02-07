import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/events", "/api/auth"];

// Routes that are auth pages (redirect to dashboard if logged in)
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Update session and get user
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // For public routes with no user, return early without any DB query
  if (isPublicRoute && !user) {
    return supabaseResponse;
  }

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User exists - fetch role ONCE
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role || "member";

    // If on auth pages, redirect to role dashboard
    if (isAuthRoute) {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        regional_leader: "/lead",
        ambassador: "/ambassador",
        member: "/member",
      };
      return NextResponse.redirect(new URL(redirectMap[role] || "/member", request.url));
    }

    // Handle /dashboard redirect
    if (pathname === "/dashboard") {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        regional_leader: "/lead",
        ambassador: "/ambassador",
        member: "/member",
      };
      return NextResponse.redirect(new URL(redirectMap[role] || "/member", request.url));
    }

    // Check role-based route access
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/lead") && !["admin", "regional_leader"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/ambassador") && !["admin", "regional_leader", "ambassador"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
