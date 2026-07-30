import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#07090a" }}
    >
      <div className="text-center max-w-[420px]">
        <div className="text-[40px] mb-3.5" aria-hidden="true">
          🔍
        </div>
        <h1 className="font-semibold mb-1.5 text-lg" style={{ color: "#ddeede" }}>
          Page not found
        </h1>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#8aaa8e" }}>
          That page doesn&apos;t exist. Head back to the search to compare prices.
        </p>
        <Link href="/" className="btn-jade inline-block">
          Back to search
        </Link>
      </div>
    </div>
  );
}
