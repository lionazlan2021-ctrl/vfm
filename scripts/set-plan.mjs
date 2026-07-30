#!/usr/bin/env node
/**
 * Move an account onto a plan.
 *
 * Billing is not wired up, so this is how a plan actually gets changed —
 * by you, deliberately, from a terminal.
 *
 *   node scripts/set-plan.mjs someone@example.com pro
 *
 * When Stripe is added later, its webhook writes the same `plan` column and
 * this script stays useful for support and testing.
 */

import { PrismaClient } from "@prisma/client";

const VALID = ["free", "pro", "premium"];

const [email, plan] = process.argv.slice(2);

if (!email || !plan) {
  console.error("Usage: node scripts/set-plan.mjs <email> <free|pro|premium>");
  process.exit(1);
}

if (!VALID.includes(plan)) {
  console.error(`Unknown plan "${plan}". Use one of: ${VALID.join(", ")}`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  // Signup stores addresses lower-cased, so match that.
  const normalised = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalised } });
  if (!user) {
    console.error(`No account found for ${normalised}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan },
  });

  console.log(`${updated.email} is now on the ${updated.plan} plan.`);
  console.log("The change applies immediately — no need to log out and back in.");
} catch (err) {
  console.error("Could not update the plan:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
