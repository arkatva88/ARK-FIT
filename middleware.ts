import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Protected route prefixes
  const isOwnerRoute = path.startsWith("/owner");
  const isTrainerRoute = path.startsWith("/trainer");
  const isMemberRoute = path.startsWith("/member");
  const isProtectedRoute = isOwnerRoute || isTrainerRoute || isMemberRoute;

  // If unauthenticated and accessing protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, check role and must_change_password
  if (user && (isProtectedRoute || path === "/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Force change password on first login
      if (profile.must_change_password && path !== "/change-password") {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }

      // If user is on /login, redirect to their role home
      if (path === "/login") {
        if (profile.role === "OWNER") return NextResponse.redirect(new URL("/owner", request.url));
        if (profile.role === "TRAINER") return NextResponse.redirect(new URL("/trainer", request.url));
        return NextResponse.redirect(new URL("/member", request.url));
      }

      // Guard role boundaries
      if (isOwnerRoute && profile.role !== "OWNER") {
        const dest = profile.role === "TRAINER" ? "/trainer" : "/member";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      if (isTrainerRoute && profile.role !== "TRAINER") {
        const dest = profile.role === "OWNER" ? "/owner" : "/member";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      if (isMemberRoute && profile.role !== "MEMBER") {
        const dest = profile.role === "OWNER" ? "/owner" : "/trainer";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
