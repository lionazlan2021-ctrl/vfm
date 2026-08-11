import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { exchangeCodeForProfile, isGoogleConfigured } from "@/lib/google-oauth";

/**
 * Completes Google sign-in and issues the normal VFM session cookie.
 *
 * Failures redirect back to the app with a short `auth_error` code rather than
 * rendering an error page — the user is mid-login and the useful thing is to
 * put them back where they can try again. Details go to the server log.
 */
export const dynamic = "force-dynamic";

function fail(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/?auth_error=${code}`, req.nextUrl.origin));
}

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) return fail(req, "google_unavailable");

  const store = await cookies();
  const expectedState = store.get("vfm_oauth_state")?.value;
  const nonce = store.get("vfm_oauth_nonce")?.value;

  // Single-use: clear them before doing any work, so a replayed callback can't
  // reuse the same state/nonce pair even if the request below fails.
  store.delete("vfm_oauth_state");
  store.delete("vfm_oauth_nonce");

  const params = req.nextUrl.searchParams;

  // The user pressed "Cancel" on Google's consent screen.
  if (params.get("error")) return fail(req, "cancelled");

  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state || !expectedState || !nonce || state !== expectedState) {
    return fail(req, "invalid_state");
  }

  try {
    const profile = await exchangeCodeForProfile({
      code,
      origin: req.nextUrl.origin,
      nonce,
    });

    // An unverified Google address must not be able to take over an existing
    // password account with the same email.
    if (!profile.emailVerified) return fail(req, "email_unverified");

    const user = await linkOrCreateUser(profile);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  } catch (err) {
    console.error("[api:auth:google:callback] sign-in failed:", err);
    return fail(req, "google_failed");
  }
}

/**
 * Finds the user this Google identity belongs to, creating one if needed.
 *
 * Three cases, in order:
 *   1. We've seen this googleId before — that's the account, log them in.
 *   2. The email matches an existing (password) account — link Google to it,
 *      so signing up with Google doesn't silently create a second account for
 *      someone who already has one. Safe because the address is verified.
 *   3. Neither — create a new account with no password hash.
 */
async function linkOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string;
  image: string | null;
}) {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (byGoogleId) {
    // Keep the display name and avatar current with Google.
    return prisma.user.update({
      where: { id: byGoogleId.id },
      data: { name: profile.name, image: profile.image },
    });
  }

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      // The existing passwordHash is deliberately left alone — linking Google
      // adds a way in, it doesn't remove the password they already had.
      data: { googleId: profile.googleId, image: profile.image ?? byEmail.image },
    });
  }

  return prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      image: profile.image,
      passwordHash: null,
    },
  });
}
