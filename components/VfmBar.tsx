export default function VfmBar({ score }: { score?: number }) {
  const hasScore = typeof score === "number" && Number.isFinite(score);
  // Clamped so an out-of-range score from the model can't overflow the track.
  const s = hasScore ? Math.max(0, Math.min(10, score)) : 0;
  const color = s >= 8 ? "#2dbe5f" : s >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-[3px]">
        <span style={{ color: "#3d5542" }}>Value for Money</span>
        <span style={{ color, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
          {hasScore ? `${s}/10` : "—"}
        </span>
      </div>
      <div
        className="h-[3px] rounded-full"
        style={{ background: "rgba(45,190,95,0.05)" }}
        role="meter"
        aria-label="Value for money score"
        aria-valuenow={hasScore ? s : undefined}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuetext={hasScore ? `${s} out of 10` : "Not rated"}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[1200ms]"
          style={{ width: `${s * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}
