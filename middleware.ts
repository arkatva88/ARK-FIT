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

  const path = request.nextUrl.pathname;
  const isPost = request.method === "POST";
  const hasRazorpaySignature = request.headers.has("x-razorpay-signature");

  // 1. Webhook Fast-Path & Rewriting:
  // If Razorpay posts to https://ark-fit-theta.vercel.app/ (as configured in dashboard) or with signature,
  // rewrite directly to the webhook handler and bypass all auth checks.
  if ((path === "/" && isPost) || hasRazorpaySignature || path === "/api/payments/webhook") {
    if (path !== "/api/payments/webhook") {
      const webhookUrl = new URL("/api/payments/webhook", request.url);
      return NextResponse.rewrite(webhookUrl, {
        request: {
          headers: request.headers,
        },
      });
    }
    return NextResponse.next();
  }

  // 2. Fast-path for Service Worker & PWA static assets
  if (
    path === "/sw.js" ||
    path === "/offline" ||
    path === "/manifest.webmanifest" ||
    path.startsWith("/icons/")
  ) {
    if (path === "/sw.js") {
      response.headers.set("Service-Worker-Allowed", "/");
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    return response;
  }

  // 3. Fast-path for other API routes (no UI redirects)
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Protected route prefixes
  const isOwnerRoute = path.startsWith("/owner");
  const isTrainerRoute = path.startsWith("/trainer");
  const isMemberRoute = path.startsWith("/member");
  const isProtectedRoute = isOwnerRoute || isTrainerRoute || isMemberRoute;
  const isAuthPage = path === "/login" || path === "/change-password";

  // If not accessing protected routes or auth pages, skip auth lookups
  if (!isProtectedRoute && !isAuthPage) {
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();

  // If unauthenticated and accessing protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, check role and must_change_password
  if (user && (isProtectedRoute || path === "/login")) {
    let role = user.user_metadata?.role;
    let mustChangePassword = user.user_metadata?.must_change_password;

    // Resilient fallback: Query profiles table only if role is not found in user_metadata
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", user.id)
        .single();

      if (profile) {
        role = profile.role;
        mustChangePassword = profile.must_change_password;
      }
    }

    if (role) {
      // Force change password on first login
      if (mustChangePassword && path !== "/change-password") {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }

      // If user is on /login, redirect to their role home
      if (path === "/login") {
        if (role === "OWNER") return NextResponse.redirect(new URL("/owner", request.url));
        if (role === "TRAINER") return NextResponse.redirect(new URL("/trainer", request.url));
        return NextResponse.redirect(new URL("/member", request.url));
      }

      // Guard role boundaries
      if (isOwnerRoute && role !== "OWNER") {
        const dest = role === "TRAINER" ? "/trainer" : "/member";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      if (isTrainerRoute && role !== "TRAINER") {
        const dest = role === "OWNER" ? "/owner" : "/member";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      if (isMemberRoute && role !== "MEMBER") {
        const dest = role === "OWNER" ? "/owner" : "/trainer";
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
