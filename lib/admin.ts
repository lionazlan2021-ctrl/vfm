import { prisma } from "./prisma";
import { getCurrentSession } from "./auth";
import { ApiError } from "./errors";

/**
 * Admin access control.
 *
 * The role is read from the database on every request, never from the session
 * cookie. A cookie is issued once and lives for 30 days; if the role were baked
 * into it, revoking an admin would not take effect until their session expired.
 * Reading the row costs one indexed lookup and makes revocation immediate.
 */

export const ADMIN_ROLE = "admin";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

/** The signed-in user, if they are an admin. Null in every other case. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  // Anything other than exactly "admin" is a normal user, so an unexpected
  // value in the column can only ever deny access, never grant it.
  if (!user || user.role !== ADMIN_ROLE) return null;
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
