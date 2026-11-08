#!/usr/bin/env node
/**
 * Set a new password for an account.
 *
 * The site has no emailed "forgot password" flow (there is no email provider
 * configured), so this is how a locked-out account gets back in — run by you,
 * deliberately, from a terminal.
 *
 *   npm run password:set -- someone@example.com
 *
 * The new password is typed at a hidden prompt rather than passed as an
 * argument, so it never lands in shell history or on screen.
 *
 * Works for Google-created accounts too: it gives them a password so they can
 * also sign in with email + password.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Must match signup's rules and lib/auth.ts hashPassword.
const MIN_LENGTH = 8;
const MAX_LENGTH = 200;
const BCRYPT_COST = 10;

function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("Run this in an interactive terminal so the password can be typed privately."));
      return;
    }
    // Echo must be off before the prompt appears, or anything typed (or
    // pasted) the instant it shows up is displayed in the clear.
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    stdout.write(question);
    let value = "";
    const onData = (chunk) => {
      // A paste arrives as one multi-character chunk, Enter included, so
      // walk it character by character.
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

const [email] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run password:set -- <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  // Signup stores addresses lower-cased, so match that.
  const normalised = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalised } });
  if (!user) {
    console.error(`No account found for ${normalised}`);
    console.error("Check the spelling — the address must match the one used at signup exactly.");
    process.exit(1);
  }

  const password = await askHidden(`New password for ${user.email}: `);
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    console.error(`Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters. Nothing was changed.`);
    process.exit(1);
  }
  const confirm = await askHidden("Type it again to confirm: ");
  if (confirm !== password) {
    console.error("The two passwords didn't match. Nothing was changed.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, BCRYPT_COST) },
  });

  console.log(`Password updated for ${user.email}. You can log in with it now.`);
} catch (err) {
  console.error("Could not update the password:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
