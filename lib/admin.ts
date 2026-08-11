import { prisma } from "./prisma";
import { getCurrentSession } from "./auth";
import { ApiError } from "./errors";

/**
 * Admin access control.
 *
 * There are two ways to be an admin, and both are checked on every request
 * rather than baked into the session cookie. A cookie lives for 30 days; if
 * admin status were stored in it, revoking someone would not take effect until
 * it expired. Re-checking costs one indexed lookup and makes revocation
 * immediate.
 *
 *   1. `role = "admin"` on the user row — set from inside the admin panel, or
 *      with `npm run role:set`.
 *   2. The account's email is listed in the ADMIN_EMAILS environment variable.
 *
 * (2) exists because (1) has a bootstrap problem: granting the first admin
 * requires database access, which whoever is deploying may not have to hand.
 * ADMIN_EMAILS is set wherever the other secrets live (Vercel's environment
 * variables), so the first admin can be granted without touching Postgres.
 *
 * It is not a back door: only someone who can already change the deployment's
 * environment can edit it, and that person could deploy arbitrary code anyway.
 */

export const ADMIN_ROLE = "admin";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

/**
 * Emails granted admin by configuration, lower-cased to match how addresses
 * are stored. Comma-separated; blank or unset means nobody.
 */
export function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Whether this email is an admin by configuration alone. */
export function isConfiguredAdminEmail(email: string): boolean {
  return configuredAdminEmails().has(email.trim().toLowerCase());
}

/**
 * The single admin predicate. Every place that decides "is this person an
 * admin" must call this one function.
 *
 * It exists because the two call sites drifted: the route guard checked both
 * grants while /api/auth/me checked only the role column, so an ADMIN_EMAILS
 * admin could reach /admin by typing the URL but never saw the link to it.
 */
export function isAdminIdentity(user: { role: string; email: string }): boolean {
  return user.role === ADMIN_ROLE || isConfiguredAdminEmail(user.email);
}

/** The signed-in user, if they are an admin. Null in every other case. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  // Anything other than exactly "admin" fails the role half of this check, so
  // an unexpected value in the column can only ever deny access, never grant it.
  if (!isAdminIdentity(user)) return null;
  return user;
}

/**
 * Same, but throws for use in API routes.
 *
 * Non-admins get 404 rather than 403: a signed-in normal user probing /api/admin
 * shouldn't be able to tell the difference between "this doesn't exist" and
 * "this exists and you're not allowed" — the latter confirms there is an admin
 * surface worth attacking.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new ApiError("not_found", "Not found.");
  return admin;
}
