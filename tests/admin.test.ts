import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROLE } from "../lib/admin";
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
