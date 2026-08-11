import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google sign-in, implemented directly against Google's OAuth 2.0 endpoints.
 *
 * The rest of this app already signs its own sessions with `jose` and stores
 * them in an httpOnly cookie, so a full auth framework (NextAuth et al) would
 * mean running two session systems side by side. The authorization-code flow is
 * small enough to own outright: redirect, exchange the code, verify the ID
 * token, upsert the user, then issue the same session cookie every other login
 * path issues.
 *
 * Configuration lives in two env vars — see "Google sign-in" in SETUP.md:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** Google's public keys, cached and rotated by jose. */
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function credentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set.");
  }
  return { clientId, clientSecret };
}

/**
 * The redirect URI registered in the Google Cloud console.
 *
 * Derived from the request's own origin rather than a hard-coded env var, so
 * localhost, Vercel previews and the live domain each send back a URI that
 * matches where the user actually is. Every origin still has to be listed as an
 * authorised redirect URI in the console — Google rejects anything else.
 */
export function redirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

/** Where to send the browser to start sign-in. */
export function authorizationUrl({
  origin,
  state,
  nonce,
}: {
  origin: string;
  state: string;
  nonce: string;
}): string {
  const { clientId } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    // Always show the account chooser. Without this a user with several Google
    // accounts is silently signed in as whichever one Google picks.
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleProfile = {
  /** Google's stable subject id. Never reuse email as the join key — it changes. */
  googleId: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
};

/**
 * Exchanges an authorization code for the user's profile.
 *
 * The ID token is verified against Google's published keys — signature, issuer,
 * audience and nonce — rather than decoded and trusted. A token that merely
 * parses proves nothing.
 */
export async function exchangeCodeForProfile({
  code,
  origin,
  nonce,
}: {
  code: string;
  origin: string;
  nonce: string;
}): Promise<GoogleProfile> {
  const { clientId, clientSecret } = credentials();

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    // Google's body names the misconfiguration (redirect_uri_mismatch and
    // invalid_client are the usual two), which is worth having in the server
    // log — it is never shown to the user.
    const detail = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Google response contained no id_token.");

  const { payload } = await jwtVerify(data.id_token, JWKS, {
    issuer: ISSUERS,
    audience: clientId,
  });

  if (payload.nonce !== nonce) {
    throw new Error("Google id_token nonce did not match the one we issued.");
  }

  const googleId = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!googleId || !email) {
    throw new Error("Google id_token was missing sub or email.");
  }

  return {
    googleId,
    email,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email,
    image: typeof payload.picture === "string" ? payload.picture : null,
    emailVerified: payload.email_verified === true,
  };
}
