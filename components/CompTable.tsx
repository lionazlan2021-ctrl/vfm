import type { Listing } from "@/types";

const RANK_CONFIG = [
  { color: "#2dbe5f", icon: "🥇" },
  { color: "#f59e0b", icon: "🥈" },
  { color: "#a78bfa", icon: "🥉" },
];

export default function CompTable({ listings }: { listings: Listing[] }) {
  const rows: [string, (l: Listing) => string][] = [
    ["Price", (l) => l.price],
    ["Store", (l) => l.store],
    ["Condition", (l) => l.condition || "New"],
    ["Shipping", (l) => l.shipping || "—"],
    ["Delivery", (l) => l.delivery || "—"],
    ["Warranty", (l) => l.warranty || "—"],
    ["Value Score", (l) => `${l.valueScore ?? "—"}/10`],
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "#3d5542", borderBottom: "1px solid rgba(45,190,95,0.09)" }}>
              Attribute
            </th>
            {listings.map((l, i) => (
              <th
                key={i}
                className="text-center px-3 py-2 font-bold"
                style={{ color: RANK_CONFIG[i]?.color, borderBottom: "1px solid rgba(45,190,95,0.09)" }}
              >
                {RANK_CONFIG[i]?.icon} {l.store}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, fn], i) => (
            <tr key={label} style={{ background: i % 2 === 0 ? "rgba(45,190,95,0.05)" : "transparent" }}>
              <td className="px-3 py-1.5 text-[11px]" style={{ color: "#3d5542" }}>
                {label}
              </td>
              {listings.map((l, j) => (
                <td key={j} className="text-center px-3 py-1.5 text-[11px]" style={{ color: "#ddeede" }}>
                  {fn(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
