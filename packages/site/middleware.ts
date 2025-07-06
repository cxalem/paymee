import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For now, let's simplify and only redirect based on pathname
  // The actual authentication check will happen client-side
  
  // If user is on login page, let them stay there
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // If user is on dashboard, let them through - client-side auth will handle redirects
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Root path - let it through, client-side will handle redirect
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Run the middleware for the top-level pages we care about.
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
