"use client";

import { useState } from "react";

export default function PaymentPlans({ price }: { price?: string }) {
  const amount = parseFloat(String(price || "0").replace(/[^0-9.]/g, "")) || 0;
  const [customMonths, setCustomMonths] = useState(6);

  const plans = [
    { name: "Tabby", icon: "💳", months: 4, apr: 0, tag: "BNPL · 0%" },
    { name: "Tamara", icon: "🟢", months: 3, apr: 0, tag: "BNPL · 0%" },
    { name: "Visa/MC", icon: "💰", months: 6, apr: 18, tag: "Card · 18% APR" },
    { name: "Visa/MC", icon: "🏦", months: 12, apr: 22, tag: "Card · 22% APR" },
  ];

  const monthlyFor = (months: number, apr: number) => {
    if (amount <= 0) return "0.00";
    const r = apr / 100 / 12;
    if (r === 0) return (amount / months).toFixed(2);
    const pay = (amount * r) / (1 - Math.pow(1 + r, -months));
    return pay.toFixed(2);
  };

  return (
    <div className="mt-3.5">
      <div className="text-[10px] font-bold tracking-wider mb-2.5" style={{ color: "#2dbe5f" }}>
        💳 PAYMENT PLANS
      </div>
      <div className="grid grid-cols-2 gap-2">
        {plans.map((p, i) => (
          <div
            key={i}
            className="rounded-[10px] px-[11px] py-[9px] transition-colors"
            style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.09)" }}
          >
            <div className="text-[11px] mb-1" style={{ color: "#8aaa8e" }}>
              {p.icon} {p.name}
            </div>
            <div className="text-base font-bold" style={{ color: "#2dbe5f", fontFamily: "JetBrains Mono, monospace" }}>
              ${monthlyFor(p.months, p.apr)}
              <span className="text-[10px]" style={{ color: "#3d5542" }}>
                /mo
              </span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "#3d5542" }}>
              {p.months}x · {p.tag}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-2.5 rounded-[10px] px-3 py-2.5"
        style={{ background: "rgba(45,190,95,0.05)", border: "1px solid rgba(45,190,95,0.09)" }}
      >
        <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "#8aaa8e" }}>
          <span>Custom plan: {customMonths} months</span>
          <span style={{ color: "#2dbe5f", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            ${monthlyFor(customMonths, 15)}/mo
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={24}
          value={customMonths}
          onChange={(e) => setCustomMonths(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{ accentColor: "#2dbe5f" }}
        />
      </div>
      <div className="text-[9.5px] mt-1.5 leading-relaxed" style={{ color: "#3d5542" }}>
        * Calculated live from listing price (${amount.toFixed(2)}). Indicative only — confirm final rate with
        provider at checkout.
      </div>
    </div>
  );
}
