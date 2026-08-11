import { requireAdmin } from "@/lib/admin";
import UsersTable from "@/components/admin/UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  return (
    <main className="px-5 md:px-10 lg:px-14 py-10 md:py-14">
      <p className="eyebrow mb-4">Users</p>
      <h1
        className="display mb-3"
        style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", color: "var(--ink)", maxWidth: "18ch" }}
      >
        Who&apos;s using it, and on <span style={{ color: "var(--accent)" }}>what plan.</span>
      </h1>
      <p className="text-[14px] mb-10 max-w-prose" style={{ color: "var(--ink-soft)" }}>
        Plan and role changes take effect on the user&apos;s next request — nobody needs to log
        out and back in.
      </p>

      {/* The current admin's id is passed so the table can disable the control
          that would revoke their own access, matching the server-side guard. */}
      <UsersTable currentAdminId={admin.id} />
    </main>
  );
}
