"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, errorMessage } from "@/lib/api-client";

/**
 * Shown at /admin to anyone who isn't an admin.
 *
 * Signing in here uses the normal login route and session — there is no
 * separate admin password. It does not grant admin: an account gets in only if
 * it is already an admin (the role column, or ADMIN_EMAILS). Anything else
 * would let anyone on the internet make themselves one.
 */
export default function AdminSignIn({
  signedInAs,
  googleEnabled,
}: {
  /** Email of the current session, when someone is signed in but isn't an admin. */
  signedInAs: string | null;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // The server re-checks admin status on render; if this account isn't
      // one, the page comes back in its "signed in, not an admin" state.
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Couldn't sign in. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="display text-[22px] inline-block mb-8" style={{ color: "var(--ink)" }}>
          VFM<span style={{ color: "var(--accent)" }}>.</span>
        </Link>

        <p className="eyebrow mb-2">Admin</p>

        {signedInAs ? (
          <>
            <h1 className="display text-[28px] mb-3" style={{ color: "var(--ink)" }}>
              This account isn&apos;t an admin
            </h1>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
              You&apos;re signed in as <strong>{signedInAs}</strong>. Sign out and use an admin
              account, or make this one an admin — see &ldquo;The admin panel&rdquo; in SETUP.md.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={signOut} disabled={busy} className="btn">
                {busy ? "Signing out…" : "Sign out"}
              </button>
              <Link href="/" className="btn-quiet" style={{ textDecoration: "none" }}>
                Back to site
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="display text-[28px] mb-6" style={{ color: "var(--ink)" }}>
              Sign in
            </h1>

            {googleEnabled && (
              <>
                <a href="/api/auth/google" className="btn-quiet w-full" style={{ textDecoration: "none" }}>
                  Continue with Google
                </a>
                <p className="text-[12.5px] mt-2 mb-5" style={{ color: "var(--ink-mute)" }}>
                  Google sign-in returns you to the home page — come back to /admin afterwards.
                </p>
              </>
            )}

            <form onSubmit={signIn} noValidate className="space-y-3">
              <div>
                <label htmlFor={emailId} className="eyebrow block mb-1.5" style={{ fontSize: 10 }}>
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor={passwordId} className="eyebrow block mb-1.5" style={{ fontSize: 10 }}>
                  Password
                </label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="field"
                />
              </div>

              {error && (
                <p id={errorId} role="alert" className="text-[13px]" style={{ color: "var(--alert)" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn w-full">
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="text-[12.5px] mt-5 leading-relaxed" style={{ color: "var(--ink-mute)" }}>
              Only admin accounts get past this page. Forgotten your password? Run{" "}
              <code>npm run password:set -- you@email.com</code> from the project folder.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
