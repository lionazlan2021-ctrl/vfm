"use client";

import { useEffect, useRef } from "react";

/**
 * The keyboard-shortcut reference, opened with "?".
 *
 * A native <dialog> shown with showModal(): the browser supplies the focus
 * trap, Escape-to-close and the inert background, which a hand-rolled modal
 * would have to reimplement (and usually gets subtly wrong).
 */

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const SHORTCUT_GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Anywhere",
    items: [
      { keys: ["/"], label: "Jump to the search box" },
      { keys: ["mod", "K"], label: "Jump to the search box, even while typing" },
      { keys: ["N"], label: "Start a new search" },
      { keys: ["?"], label: "Show these shortcuts" },
      { keys: ["Esc"], label: "Close a panel or menu" },
    ],
  },
  {
    title: "On a comparison",
    items: [
      { keys: ["1", "–", "5"], label: "Jump to that seller's card" },
      { keys: ["T"], label: "Show or hide the side-by-side table" },
    ],
  },
];

export default function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const mod = isMac() ? "⌘" : "Ctrl";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, not its content.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="shortcuts-title"
      className="shortcuts-dialog"
    >
      <div className="p-7">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <p className="eyebrow mb-2">Faster with a keyboard</p>
            <h2 id="shortcuts-title" className="display text-[26px]" style={{ color: "var(--ink)" }}>
              Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="btn-quiet"
            style={{ padding: "6px 10px", minWidth: 40, minHeight: 40 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-7">
          {SHORTCUT_GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="eyebrow mb-3">{g.title}</h3>
              <dl className="grid gap-2.5">
                {g.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-6">
                    <dt className="text-[14px]" style={{ color: "var(--ink-soft)" }}>
                      {item.label}
                    </dt>
                    <dd className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((k, i) =>
                        k === "–" ? (
                          <span key={i} className="text-[12px]" style={{ color: "var(--ink-mute)" }}>
                            to
                          </span>
                        ) : (
                          <kbd key={i} className="kbd">
                            {k === "mod" ? mod : k}
                          </kbd>
                        )
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
