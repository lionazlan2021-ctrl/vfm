import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { apiError, handle, readJson } from "@/lib/http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

const LoginSchema = z.object({
  // Must match signup's normalisation, or accounts created as "Sam@x.com"
  // could never be logged into.
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function POST(req: NextRequest) {
  return handle("api:auth:login", async () => {
    const rl = hit(callerKey(req), LIMITS.auth.limit, LIMITS.auth.windowSeconds);
    if (!rl.ok) {
      return apiError("rate_limited", "Too many attempts. Please wait a few minutes and try again.", {
        headers: rateLimitHeaders(rl),
      });
    }

    const { email, password } = await readJson(req, LoginSchema, { maxBytes: 8 * 1024 });

    const user = await prisma.user.findUnique({ where: { email } });

    // The same message for "no such user", "wrong password", and "this account
    // signs in with Google" so the response can't be used to discover which
    // addresses have accounts, or how they authenticate.
    //
    // passwordHash is null for Google-created accounts. Guarding on it here
    // matters: bcrypt.compare against a null hash resolves false rather than
    // throwing, so without this the route would still answer correctly, but
    // only by accident.
    const valid =
      user?.passwordHash != null ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return apiError("unauthorized", "Incorrect email or password.");
    }

    const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  });
}
