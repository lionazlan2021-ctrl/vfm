export default function VfmBar({ score }: { score?: number }) {
  const hasScore = typeof score === "number" && Number.isFinite(score);
  // Clamped so an out-of-range score from the model can't overflow the track.
  const s = hasScore ? Math.max(0, Math.min(10, score)) : 0;

  // Green for a genuinely good buy, amber for middling, muted for poor — the
  // accent is reserved for value signals so it keeps its meaning.
  const color = s >= 8 ? "var(--accent)" : s >= 5 ? "var(--flag)" : "var(--ink-mute)";

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="eyebrow" style={{ fontSize: 10 }}>
          Value score
        </span>
        <span className="numeric text-[13px] font-medium" style={{ color }}>
          {hasScore ? (
            <>
              {s}
              <span style={{ color: "var(--ink-mute)" }}> / 10</span>
            </>
          ) : (
            <span style={{ color: "var(--ink-mute)" }}>Not rated</span>
          )}
        </span>
      </div>
      <div
        className="h-[5px] rounded-full overflow-hidden"
        style={{ background: "var(--panel-alt)" }}
        role="meter"
        aria-label="Value for money score"
        aria-valuenow={hasScore ? s : undefined}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuetext={hasScore ? `${s} out of 10` : "Not rated"}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${s * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}
