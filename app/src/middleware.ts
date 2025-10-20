// import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Temporarily disable NextAuth middleware due to Yallist compatibility issue
  // const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to auth pages without authentication
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Allow access to public API routes
    if (pathname.startsWith("/api/public/")) {
      return NextResponse.next();
    }

    // Temporarily allow all routes while NextAuth is disabled
    // TODO: Re-enable authentication after fixing Yallist issue
    
    // Allow development access to all routes for now
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // In production, you'd want proper authentication here

    return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};