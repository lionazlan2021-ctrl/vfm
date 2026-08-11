#!/usr/bin/env node
/**
 * Promote an account to admin, or demote it back.
 *
 *   node scripts/set-role.mjs someone@example.com admin
 *   node scripts/set-role.mjs someone@example.com user
 *
 * This is how the FIRST admin is created — the admin panel can promote others,
 * but somebody has to be let in from outside it first. Deliberately a terminal
 * command: there is no self-serve path to admin, and no UI that could be
 * tricked into granting it.
 */

import { PrismaClient } from "@prisma/client";

const VALID = ["user", "admin"];

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error("Usage: node scripts/set-role.mjs <email> <user|admin>");
  process.exit(1);
}

if (!VALID.includes(role)) {
  console.error(`Unknown role "${role}". Use one of: ${VALID.join(", ")}`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  // Signup stores addresses lower-cased, so match that.
  const normalised = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalised } });
  if (!user) {
    console.error(`No account found for ${normalised}`);
    console.error("Create the account first (sign up on the site), then run this again.");
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  console.log(`${updated.email} is now: ${updated.role}`);
  if (updated.role === "admin") {
    console.log("They can reach /admin immediately — no need to log out and back in.");
  }
} catch (err) {
  console.error("Could not update the role:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
