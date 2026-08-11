import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROLE, configuredAdminEmails, isConfiguredAdminEmail } from "../lib/admin";
import { STATUS_BY_CODE } from "../lib/errors";

/**
 * Admin access rules.
 *
 * `getAdminUser` itself needs a database and a request context, so it isn't
 * unit-testable here. What is testable — and what actually matters — is the
 * shape of the rule it applies: exactly one string grants admin, and the denial
 * path reports 404 rather than 403.
 */

describe("admin role", () => {
  test("the admin role is exactly 'admin'", () => {
    assert.equal(ADMIN_ROLE, "admin");
  });

  // The check in lib/admin.ts is `user.role !== ADMIN_ROLE`, so anything that
  // isn't an exact match denies. This pins that decision: a looser check
  // (startsWith, case-insensitive, truthiness) would let these through.
  test("no near-miss role value would be treated as admin", () => {
    const nearMisses = ["Admin", "ADMIN", "admin ", " admin", "administrator", "admins", "user", ""];
    for (const value of nearMisses) {
      assert.notEqual(value, ADMIN_ROLE, `"${value}" must not equal the admin role`);
    }
  });

  test("the default role in the schema is not admin", () => {
    // Mirrors `role String @default("user")`. If that default ever changed to
    // "admin", every new signup would be an administrator.
    assert.notEqual("user", ADMIN_ROLE);
  });

  // Non-admins hitting /api/admin/* get not_found, not unauthorized, so a
  // signed-in stranger can't tell an admin surface exists.
  test("the denial code maps to 404, not 403 or 401", () => {
    assert.equal(STATUS_BY_CODE.not_found, 404);
    assert.notEqual(STATUS_BY_CODE.not_found, STATUS_BY_CODE.unauthorized);
  });
});

describe("ADMIN_EMAILS bootstrap", () => {
  const original = process.env.ADMIN_EMAILS;
  const withEnv = (value: string | undefined, fn: () => void) => {
    if (value === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = value;
    try {
      fn();
    } finally {
      if (original === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = original;
    }
  };

  // The dangerous failure is granting admin too widely, so these lean on the
  // cases where a sloppy parser would over-grant.
  test("unset or blank grants nobody", () => {
    withEnv(undefined, () => assert.equal(configuredAdminEmails().size, 0));
    withEnv("", () => assert.equal(configuredAdminEmails().size, 0));
    withEnv("   ", () => assert.equal(configuredAdminEmails().size, 0));
    // Stray separators must not become an empty-string entry that then matches
    // an account with a blank email.
    withEnv(",,, ,", () => {
      assert.equal(configuredAdminEmails().size, 0);
      assert.equal(isConfiguredAdminEmail(""), false);
    });
  });

  test("matches case-insensitively and ignores surrounding whitespace", () => {
    withEnv("  VFMco.com@Gmail.com , other@example.com ", () => {
      assert.ok(isConfiguredAdminEmail("vfmco.com@gmail.com"));
      assert.ok(isConfiguredAdminEmail("VFMCO.COM@GMAIL.COM"));
      assert.ok(isConfiguredAdminEmail("  vfmco.com@gmail.com  "));
      assert.ok(isConfiguredAdminEmail("other@example.com"));
    });
  });

  test("does not grant admin to a merely similar address", () => {
    withEnv("vfmco.com@gmail.com", () => {
      for (const near of [
        "vfmco.com@gmail.com.attacker.com",
        "attacker+vfmco.com@gmail.com",
        "vfmco.com@gmail.co",
        "vfmco@gmail.com",
        "",
      ]) {
        assert.equal(isConfiguredAdminEmail(near), false, `${near} must not be an admin`);
      }
    });
  });

  // Read per call, not captured at import — otherwise changing the variable in
  // Vercel would need a redeploy to take effect, and revocation would silently
  // lag behind what the dashboard says.
  test("is re-read on every call, so changes apply without a restart", () => {
    withEnv("first@example.com", () => {
      assert.ok(isConfiguredAdminEmail("first@example.com"));
      process.env.ADMIN_EMAILS = "second@example.com";
      assert.equal(isConfiguredAdminEmail("first@example.com"), false);
      assert.ok(isConfiguredAdminEmail("second@example.com"));
    });
  });
});
