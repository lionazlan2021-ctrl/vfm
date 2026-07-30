"use client";

import { useState, useId } from "react";

/**
 * Instalment estimator.
 *
 * Real amortisation maths from the listing price. These are indicative rates,
 * not offers — the copy says so, because quoting a monthly figure as if it were
 * an approved rate would be misleading.
 */
export default function PaymentPlans({ price }: { price?: string }) {
  const amount = parseFloat(String(price || "0").replace(/[^0-9.]/g, "")) || 0;
  const [months, setMonths] = useState(6);
  const id = useId();

  const monthly = (m: number, apr: number) => {
    if (amount <= 0 || m <= 0) return "0.00";
    const r = apr / 100 / 12;
    if (r === 0) return (amount / m).toFixed(2);
    return ((amount * r) / (1 - Math.pow(1 + r, -m))).toFixed(2);
  };

  const totalAt = (m: number, apr: number) => (parseFloat(monthly(m, apr)) * m).toFixed(2);

  const rows = [
    { label: "4 payments, interest free", months: 4, apr: 0 },
    { label: "12 months at 18% APR", months: 12, apr: 18 },
  ];

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--rule)" }}>
      <p className="eyebrow mb-3" style={{ fontSize: 10 }}>
        Spread the cost
      </p>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
              {r.label}
            </span>
            <span className="numeric text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              ${monthly(r.months, r.apr)}
              <span style={{ color: "var(--ink-mute)" }}>/mo</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <label htmlFor={id} className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
            Over {months} months at 15% APR
          </label>
          <span className="numeric text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            ${monthly(months, 15)}
            <span style={{ color: "var(--ink-mute)" }}>/mo</span>
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={2}
          max={24}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
        <p className="numeric text-[11px] mt-1.5" style={{ color: "var(--ink-mute)" }}>
          ${totalAt(months, 15)} total · ${(parseFloat(totalAt(months, 15)) - amount).toFixed(2)} in interest
        </p>
      </div>

      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: "var(--ink-mute)" }}>
        Calculated from the ${amount.toFixed(2)} listing price. Indicative only — the rate you
        are offered at checkout may differ.
      </p>
    </div>
  );
}
