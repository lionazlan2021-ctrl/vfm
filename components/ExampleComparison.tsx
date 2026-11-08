/**
 * A static, illustrative comparison for the landing page.
 *
 * It exists to show the product's one idea before anyone searches: the pick is
 * not the cheapest listing. The figures are made up and labelled as such — a
 * landing page that implied live prices would be the kind of quiet dishonesty
 * the product itself is meant to catch.
 */

type Row = {
  store: string;
  condition: string;
  price: string;
  note: string;
  score: number;
  pick?: boolean;
};

const ROWS: Row[] = [
  { store: "eBay seller", condition: "Refurbished", price: "$279", note: "90-day warranty, 7–10 day delivery", score: 6 },
  { store: "Best Buy", condition: "New", price: "$328", note: "1-year warranty, free 2-day shipping", score: 9, pick: true },
  { store: "Amazon", condition: "New", price: "$348", note: "1-year warranty, next-day delivery", score: 8 },
];

function scoreColor(score: number) {
  return score >= 8 ? "var(--accent)" : score >= 5 ? "var(--flag)" : "var(--ink-mute)";
}

export default function ExampleComparison() {
  return (
    <figure className="card overflow-hidden" style={{ margin: 0 }}>
      <div
        className="flex items-baseline justify-between gap-4 px-5 md:px-6 py-4"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <p className="eyebrow whitespace-nowrap">Example result</p>
        <p className="text-[13px] truncate min-w-0" style={{ color: "var(--ink-mute)" }}>
          Sony WH-1000XM5 headphones
        </p>
      </div>

      <ul>
        {ROWS.map((r, i) => (
          <li
            key={r.store}
            className="grid items-center gap-x-4 gap-y-2 px-5 md:px-6 py-4"
            style={{
              gridTemplateColumns: "minmax(0,1fr) auto",
              borderTop: i === 0 ? "none" : "1px solid var(--rule)",
              background: r.pick ? "var(--accent-wash)" : "transparent",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {r.store}
                </span>
                <span
                  className="eyebrow"
                  style={{ fontSize: 9.5, color: r.condition === "New" ? "var(--ink-mute)" : "var(--flag)" }}
                >
                  {r.condition}
                </span>
                {r.pick && (
                  <span
                    className="eyebrow px-2 py-0.5 rounded-full"
                    style={{ fontSize: 9.5, background: "var(--accent)", color: "var(--paper)" }}
                  >
                    Best value
                  </span>
                )}
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: "var(--ink-mute)" }}>
                {r.note}
              </p>
            </div>

            <div className="text-right">
              <p className="display" style={{ fontSize: "1.35rem", color: "var(--ink)" }}>
                {r.price}
              </p>
            </div>

            {/* Value bar spans the row: the score, drawn, so the comparison reads at a glance. */}
            <div className="col-span-2 flex items-center gap-3">
              <div className="flex-1 h-[5px] rounded-full" style={{ background: "var(--rule)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.score * 10}%`, background: scoreColor(r.score) }}
                />
              </div>
              <span className="numeric text-[12px] w-[38px] text-right" style={{ color: scoreColor(r.score) }}>
                {r.score}/10
              </span>
            </div>
          </li>
        ))}
      </ul>

      <figcaption
        className="px-5 md:px-6 py-4 text-[13px] leading-relaxed"
        style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-soft)" }}
      >
        The cheapest listing isn&apos;t the pick: a 90-day warranty and a week-long wait cost
        it more than the $49 it saves.{" "}
        <span style={{ color: "var(--ink-mute)" }}>Illustration — not live prices.</span>
      </figcaption>
    </figure>
  );
}
