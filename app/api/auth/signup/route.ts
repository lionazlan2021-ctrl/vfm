import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { apiError, handle, readJson } from "@/lib/http";
import { callerKey, hit, LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "That name is too long."),
  // Addresses are lower-cased so "Sam@x.com" and "sam@x.com" are one account.
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "That password is too long."),
});

export async function POST(req: NextRequest) {
  return handle("api:auth:signup", async () => {
    const rl = hit(callerKey(req), LIMITS.auth.limit, LIMITS.auth.windowSeconds);
    if (!rl.ok) {
      return apiError("rate_limited", "Too many attempts. Please wait a few minutes and try again.", {
        headers: rateLimitHeaders(rl),
      });
    }

    const { name, email, password } = await readJson(req, SignupSchema, { maxBytes: 8 * 1024 });

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({ data: { name, email, passwordHash } });
    } catch (err) {
      // Relying on the unique constraint rather than a prior findUnique closes
      // the race where two simultaneous signups both pass the existence check.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return apiError("conflict", "An account with this email already exists.");
      }
      throw err;
    }

    const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  });
}
