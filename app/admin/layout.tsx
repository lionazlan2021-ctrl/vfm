import Link from "next/link";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin";
import { getCurrentSession } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/google-oauth";
import AdminSignIn from "@/components/admin/AdminSignIn";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Admin — VFM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Guards every page under /admin.
 *
 * Anyone who isn't an admin gets a sign-in form, so the owner can log in here
 * directly instead of via the main site. (This used to be a 404, which hid the
 * panel's existence but left the owner with no way in from this URL.) Signing
 * in never grants admin; only admin accounts get past it.
 *
 * The API routes and each page do the same check independently — Next renders
 * pages alongside their layout, so this layout alone would protect nothing.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) {
    const session = await getCurrentSession();
    return <AdminSignIn signedInAs={session?.email ?? null} googleEnabled={isGoogleConfigured()} />;
  }

  return (
    <div className="min-h-screen">
      <header
        className="px-5 md:px-10 lg:px-14 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <div className="flex items-baseline gap-4">
          <Link href="/" aria-label="VFM home">
            <Logo size={20} />
          </Link>
          <span className="eyebrow" style={{ color: "var(--ink-mute)" }}>
            Admin
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Link href="/admin" className="nav-link" style={{ width: "auto" }}>
            Overview
          </Link>
          <Link href="/admin/users" className="nav-link" style={{ width: "auto" }}>
            Users
          </Link>
          <Link href="/" className="nav-link" style={{ width: "auto" }}>
            Back to site
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}
