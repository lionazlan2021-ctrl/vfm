export default function VfmBar({ score }: { score?: number }) {
  const s = Number(score) || 0;
  const color = s >= 8 ? "#2dbe5f" : s >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-[3px]">
        <span style={{ color: "#3d5542" }}>Value for Money</span>
        <span style={{ color, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{s}/10</span>
      </div>
      <div className="h-[3px] rounded-full" style={{ background: "rgba(45,190,95,0.05)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-[1200ms]"
          style={{ width: `${s * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}
