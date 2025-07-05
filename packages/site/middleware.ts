import { PrivyClient } from "@privy-io/server-auth";
import { NextRequest, NextResponse } from "next/server";

// Re-use a single Privy client across invocations.
let privy: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (privy) return privy;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.NEXT_PUBLIC_PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "PRIVY_APP_ID and PRIVY_APP_SECRET must be defined in the environment at runtime."
    );
  }

  privy = new PrivyClient(appId, appSecret);
  return privy;
}
async function hasValidPrivySession(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get("privy-token")?.value;

  const headerToken = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  const token = cookieToken || headerToken;
  if (!token) return false;

  try {
    await getPrivyClient().verifyAuthToken(token);
    return true;
  } catch (err) {
    // Log once for easier debugging – remove or downgrade for production.
    console.error("[Privy] token verification failed:", err);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isAuthenticated = await hasValidPrivySession(request);
  const { pathname } = request.nextUrl;

  // 1. Visiting /login (or the landing page) while already authenticated → /dashboard
  if (isAuthenticated && (pathname === "/" || pathname.startsWith("/login"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Visiting any /dashboard route without authentication → /login
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Otherwise continue the request chain
  return NextResponse.next();
}

// Run the middleware for the top-level pages we care about.
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
