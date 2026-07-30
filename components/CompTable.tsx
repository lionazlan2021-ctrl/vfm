import type { Listing } from "@/types";

export default function CompTable({
  listings,
  recommendedIndex,
}: {
  listings: Listing[];
  recommendedIndex: number;
}) {
  const rows: [string, (l: Listing) => string][] = [
    ["Price", (l) => l.price],
    ["Was", (l) => l.originalPrice || "—"],
    ["Condition", (l) => l.condition || "Not listed"],
    ["Shipping", (l) => l.shipping || "Not listed"],
    ["Delivery", (l) => l.delivery || "Not listed"],
    ["Warranty", (l) => l.warranty || "Not listed"],
    ["Seller rating", (l) => (typeof l.sellerRating === "number" ? `${l.sellerRating} / 5` : "Not listed")],
    ["Value score", (l) => (typeof l.valueScore === "number" ? `${l.valueScore} / 10` : "Not rated")],
  ];

  return (
    // Wide tables scroll inside their own container rather than pushing the page sideways.
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[460px]">
        <caption className="sr-only">
          Side-by-side comparison of the listings found, including price, condition, shipping,
          delivery, warranty and value score.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="eyebrow text-left px-3 py-3 font-medium"
              style={{ borderBottom: "1px solid var(--rule-strong)" }}
            >
              &nbsp;
            </th>
            {listings.map((l, i) => (
              <th
                key={`${l.store}-${i}`}
                scope="col"
                className="text-left px-3 py-3 align-bottom"
                style={{ borderBottom: "1px solid var(--rule-strong)" }}
              >
                <span className="block font-semibold" style={{ color: "var(--ink)" }}>
                  {l.store}
                </span>
                {i === recommendedIndex && (
                  <span className="eyebrow block mt-1" style={{ color: "var(--accent)", fontSize: 10 }}>
                    Best value
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, fn]) => (
            <tr key={label}>
              <th
                scope="row"
                className="eyebrow px-3 py-2.5 text-left font-normal align-top"
                style={{ borderBottom: "1px solid var(--rule)", fontSize: 10 }}
              >
                {label}
              </th>
              {listings.map((l, j) => (
                <td
                  key={`${l.store}-${j}`}
                  className="px-3 py-2.5"
                  style={{
                    borderBottom: "1px solid var(--rule)",
                    color: j === recommendedIndex ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: j === recommendedIndex ? 500 : 400,
                  }}
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
