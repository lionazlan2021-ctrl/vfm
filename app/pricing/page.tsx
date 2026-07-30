import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, PLAN_ORDER, formatPrice, getPlan } from "@/lib/plans";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Plans and pricing — VFM",
  description:
    "Three plans for comparing what things are actually worth. Free to start, with deeper research and larger monthly allowances on Pro and Premium.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getCurrentSession();
  let currentPlanId = "free";

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    });
    currentPlanId = getPlan(user?.plan).id;
  }

  return (
    <main className="min-h-screen">
      <header
        className="px-5 md:px-10 lg:px-16 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Link href="/" className="display text-[20px]" style={{ color: "var(--ink)" }}>
          VFM<span style={{ color: "var(--accent)" }}>.</span>
        </Link>
        <Link href="/" className="btn-quiet" style={{ padding: "8px 14px" }}>
          Back to search
        </Link>
      </header>

      <section className="px-5 md:px-10 lg:px-16 pt-16 md:pt-24">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">Plans</p>
            <h1
              className="display"
              style={{ fontSize: "clamp(2.3rem, 5.2vw, 4rem)", color: "var(--ink)" }}
            >
              Pay for the research,
              <br />
              not the <span style={{ color: "var(--accent)" }}>guesswork.</span>
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="text-[15px] leading-relaxed max-w-prose" style={{ color: "var(--ink-soft)" }}>
              Every search runs a live web search and a full value judgement across three
              sellers, which costs us real money each time. The plans differ in how many
              searches you get and how hard the model works on each one.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-16 mt-14 md:mt-20">
        <div className="grid gap-5 md:gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))" }}>
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isCurrent = id === currentPlanId;
            const isFeatured = id === "pro";

            return (
              <div
                key={id}
                className="card flex flex-col p-6 md:p-7 relative"
                style={{
                  borderColor: isFeatured ? "var(--accent)" : "var(--rule)",
                  borderWidth: isFeatured ? 1.5 : 1,
                  background: isFeatured ? "var(--paper)" : "transparent",
                }}
              >
                {isFeatured && (
                  <span
                    className="absolute -top-[9px] left-6 px-2.5 py-[2px] rounded-full eyebrow"
                    style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.1em" }}
                  >
                    Most chosen
                  </span>
                )}

                <div className="mt-1">
                  <h2 className="display text-[1.6rem]" style={{ color: "var(--ink)" }}>
                    {plan.name}
                  </h2>
                  <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="display" style={{ fontSize: "2.6rem", lineHeight: 1, color: "var(--ink)" }}>
                    {formatPrice(plan)}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--ink-mute)" }}>
                    per month
                  </span>
                </div>

                <dl className="mt-6 pt-5 space-y-3" style={{ borderTop: "1px solid var(--rule)" }}>
                  <div className="flex justify-between gap-3">
                    <dt className="eyebrow" style={{ fontSize: 10 }}>
                      Searches
                    </dt>
                    <dd className="numeric text-[13px]" style={{ color: "var(--ink)" }}>
                      {plan.searchesPerMonth.toLocaleString()} / month
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="eyebrow" style={{ fontSize: 10 }}>
                      Model
                    </dt>
                    <dd className="numeric text-[12px] text-right" style={{ color: "var(--ink-soft)" }}>
                      {plan.model}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="eyebrow" style={{ fontSize: 10 }}>
                      Reasoning
                    </dt>
                    <dd className="text-[13px] capitalize" style={{ color: "var(--ink-soft)" }}>
                      {plan.searchEffort}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-[13.5px] flex gap-2.5 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                      <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                        +
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {isCurrent ? (
                    <span
                      className="w-full inline-flex items-center justify-center py-[11px] rounded-[10px] text-[14px]"
                      style={{ border: "1px dashed var(--rule-strong)", color: "var(--ink-mute)" }}
                    >
                      Your current plan
                    </span>
                  ) : plan.price === 0 ? (
                    <Link href="/" className="btn-quiet w-full">
                      Start free
                    </Link>
                  ) : (
                    // Billing is not connected yet — this is deliberately honest
                    // rather than a button that pretends to take payment.
                    <span
                      className="w-full inline-flex items-center justify-center py-[11px] rounded-[10px] text-[14px]"
                      style={{ border: "1px dashed var(--rule-strong)", color: "var(--ink-mute)" }}
                      title="Checkout is not connected yet"
                    >
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 md:px-10 lg:px-16 mt-16 md:mt-24 pb-24">
        <div className="panel px-6 md:px-12 py-12 md:py-16">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-4">Honestly</p>
              <h2 className="display" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", color: "var(--ink)" }}>
                Billing isn&apos;t switched on
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-[15px] leading-relaxed max-w-prose" style={{ color: "var(--ink-soft)" }}>
                The plans above are real — they control which model runs your search, how much
                reasoning it spends, and your monthly allowance. What isn&apos;t built yet is
                the payment step, so nothing here will charge you. Everyone starts on Free.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
