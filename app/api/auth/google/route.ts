import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizationUrl, isGoogleConfigured } from "@/lib/google-oauth";

/**
 * Starts Google sign-in.
 *
 * `state` and `nonce` are generated here, stored in short-lived httpOnly
 * cookies, and checked again in the callback:
 *
 *   state — proves the callback came from a flow this browser started, which is
 *           what stops a third party from feeding us their own auth code (login
 *           CSRF).
 *   nonce — bound into the ID token by Google, so a token minted for some other
 *           session can't be replayed into this one.
 */
export const dynamic = "force-dynamic";

const TEN_MINUTES = 60 * 10;

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    // Nothing to redirect to — send the user back to the app rather than to a
    // Google error page they can't act on.
    return NextResponse.redirect(new URL("/?auth_error=google_unavailable", req.nextUrl.origin));
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const store = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" still sends the cookie on Google's top-level redirect back to us,
    // while keeping it off cross-site subrequests.
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEN_MINUTES,
  };
  store.set("vfm_oauth_state", state, options);
  store.set("vfm_oauth_nonce", nonce, options);

  return NextResponse.redirect(authorizationUrl({ origin: req.nextUrl.origin, state, nonce }));
}
