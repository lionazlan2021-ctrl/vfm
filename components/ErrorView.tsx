export default function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-5 py-24">
      <p className="eyebrow mb-4">Search failed</p>
      <h1 className="display mb-3" style={{ fontSize: "clamp(1.7rem, 3vw, 2.2rem)", color: "var(--ink)" }}>
        That didn&apos;t work
      </h1>
      <p className="text-[15px] leading-relaxed max-w-prose mb-7" style={{ color: "var(--ink-soft)" }}>
        {message}
      </p>
      <button onClick={onRetry} className="btn">
        Start a new search
      </button>
    </div>
  );
}
