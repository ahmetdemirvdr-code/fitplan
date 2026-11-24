import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/", "/login", "/register", "/admin/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const cookieToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const authHeader = request.headers.get("authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") && authHeader.length > 7
      ? authHeader.slice(7).trim()
      : null;

  const hasAuth = Boolean(cookieToken || bearerToken);

  if (!isPublicRoute && !hasAuth) {
    // Mobile / API clients expect JSON, not a login redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const loginUrl = new URL(
      pathname.startsWith("/admin") ? "/admin/login" : "/login",
      request.url
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (cookieToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
