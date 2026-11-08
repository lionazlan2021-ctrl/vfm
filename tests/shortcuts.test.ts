import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { matches, type Shortcut } from "../lib/use-shortcuts";
import { haptic } from "../lib/haptics";

const key = (k: string, mods: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
});
const s = (k: string, mod = false): Shortcut => ({ key: k, mod, handler: () => {} });

describe("shortcut matching", () => {
  test("matches a plain key, case-insensitively", () => {
    assert.ok(matches(key("n"), s("n")));
    assert.ok(matches(key("N"), s("n")));
  });

  // "n" must never hijack the browser's ⌘N / Ctrl+N (new window).
  test("a plain shortcut ignores the same key with ⌘, Ctrl or Alt held", () => {
    assert.equal(matches(key("n", { metaKey: true }), s("n")), false);
    assert.equal(matches(key("n", { ctrlKey: true }), s("n")), false);
    assert.equal(matches(key("n", { altKey: true }), s("n")), false);
  });

  test("⌘K and Ctrl+K both match a mod shortcut, bare K does not", () => {
    assert.ok(matches(key("k", { metaKey: true }), s("k", true)));
    assert.ok(matches(key("k", { ctrlKey: true }), s("k", true)));
    assert.equal(matches(key("k"), s("k", true)), false);
  });

  test("different keys never match", () => {
    assert.equal(matches(key("m"), s("n")), false);
  });
});

describe("haptic", () => {
  // In Node (and iOS Safari) there's no Vibration API; it must quietly do nothing.
  test("is a silent no-op where vibration isn't supported", () => {
    assert.doesNotThrow(() => haptic("success"));
  });
});
