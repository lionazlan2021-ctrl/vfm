"use client";

import { useEffect, useRef } from "react";

/**
 * Global keyboard shortcuts.
 *
 * Single-key shortcuts ("n", "?") are ignored while the user is typing in a
 * field, so they never steal letters from a search. Shortcuts with ⌘/Ctrl, and
 * Escape, work everywhere.
 */

export type Shortcut = {
  /** `KeyboardEvent.key`, compared case-insensitively. */
  key: string;
  /** Require ⌘ on Mac or Ctrl elsewhere. */
  mod?: boolean;
  /** Also fire while focus is in a text field. Implied by `mod`. */
  allowInInput?: boolean;
  handler: (e: KeyboardEvent) => void;
};

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    // Buttons and checkboxes don't take text, so letter shortcuts are safe there.
    return !["button", "submit", "reset", "checkbox", "radio", "range", "file"].includes(type);
  }
  return false;
}

/** Whether a keydown matches a shortcut, ignoring where focus is. */
export function matches(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">, s: Shortcut): boolean {
  if (e.key.toLowerCase() !== s.key.toLowerCase()) return false;
  const mod = e.metaKey || e.ctrlKey;
  if (s.mod) return mod;
  // A plain shortcut must not fire on ⌘N, Ctrl+R and the like — those belong to the browser.
  return !mod && !e.altKey;
}

export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
  // Kept in a ref so callers can pass a fresh array every render without
  // re-binding the listener each time.
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const typing = isTypingTarget(e.target);
      for (const s of ref.current) {
        if (!matches(e, s)) continue;
        if (typing && !s.mod && !s.allowInInput) continue;
        s.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
