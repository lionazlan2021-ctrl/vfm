import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin — VFM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Guards every page under /admin.
 *
 * Non-admins get the 404 page, not a "forbidden" message — the existence of an
 * admin area isn't something a signed-in stranger needs confirmed. The API
 * routes do the same check independently; this layout only controls what
 * renders, and would be worthless on its own.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  return (
    <div className="min-h-screen">
      <header
        className="px-5 md:px-10 lg:px-14 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <div className="flex items-baseline gap-4">
          <Link href="/" className="display text-[20px]" style={{ color: "var(--ink)" }}>
            VFM<span style={{ color: "var(--accent)" }}>.</span>
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
