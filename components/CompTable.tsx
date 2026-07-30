import type { Listing } from "@/types";

const RANK_CONFIG = [
  { color: "#2dbe5f", icon: "🥇" },
  { color: "#f59e0b", icon: "🥈" },
  { color: "#a78bfa", icon: "🥉" },
];

export default function CompTable({
  listings,
  recommendedIndex,
}: {
  listings: Listing[];
  recommendedIndex: number;
}) {
  const rows: [string, (l: Listing) => string][] = [
    ["Price", (l) => l.price],
    ["Store", (l) => l.store],
    ["Condition", (l) => l.condition || "Not listed"],
    ["Shipping", (l) => l.shipping || "Not listed"],
    ["Delivery", (l) => l.delivery || "Not listed"],
    ["Warranty", (l) => l.warranty || "Not listed"],
    ["Seller rating", (l) => (typeof l.sellerRating === "number" ? `${l.sellerRating}/5` : "Not listed")],
    ["Value score", (l) => (typeof l.valueScore === "number" ? `${l.valueScore}/10` : "Not rated")],
  ];

  return (
    // Wide tables scroll inside their own container rather than pushing the page sideways.
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[420px]">
        <caption className="sr-only">
          Side-by-side comparison of the listings found, including price, condition, shipping,
          delivery, warranty and value score.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="text-left px-3 py-2 font-medium"
              style={{ color: "#3d5542", borderBottom: "1px solid rgba(45,190,95,0.09)" }}
            >
              Attribute
            </th>
            {listings.map((l, i) => (
              <th
                key={`${l.store}-${i}`}
                scope="col"
                className="text-center px-3 py-2 font-bold whitespace-nowrap"
                style={{
                  color: RANK_CONFIG[i]?.color,
                  borderBottom: "1px solid rgba(45,190,95,0.09)",
                }}
              >
                <span aria-hidden="true">{RANK_CONFIG[i]?.icon}</span> {l.store}
                {i === recommendedIndex && (
                  <span className="block text-[9px] font-medium" style={{ color: "#2dbe5f" }}>
                    ✦ VFM pick
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, fn], i) => (
            <tr key={label} style={{ background: i % 2 === 0 ? "rgba(45,190,95,0.05)" : "transparent" }}>
              <th
                scope="row"
                className="px-3 py-1.5 text-[11px] text-left font-normal"
                style={{ color: "#3d5542" }}
              >
                {label}
              </th>
              {listings.map((l, j) => (
                <td
                  key={`${l.store}-${j}`}
                  className="text-center px-3 py-1.5 text-[11px]"
                  style={{ color: "#ddeede" }}
                >
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
