import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center px-5 md:px-16">
      <div className="max-w-2xl">
        <p className="eyebrow mb-4">404</p>
        <h1 className="display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--ink)" }}>
          There&apos;s nothing here
        </h1>
        <p className="text-[15px] leading-relaxed max-w-prose mb-8" style={{ color: "var(--ink-soft)" }}>
          That page doesn&apos;t exist. Head back and compare something instead.
        </p>
        <Link href="/" className="btn">
          Back to search
        </Link>
      </div>
    </main>
  );
}
