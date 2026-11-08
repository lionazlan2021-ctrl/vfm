import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import ExampleComparison from "@/components/ExampleComparison";
import LandingNav from "@/components/landing/LandingNav";
import LandingSearch from "@/components/landing/LandingSearch";
import ScrollProgress from "@/components/landing/ScrollProgress";
import ScrollHighlight from "@/components/landing/ScrollHighlight";
import Marquee from "@/components/landing/Marquee";

/**
 * The public landing page — what VFM is, before anyone uses it. The search app
 * itself lives at /app.
 *
 * Signed-in visitors see the same page with "Open VFM" instead of "Try it
 * free"; it doesn't redirect them, so the page stays reachable for the owner.
 *
 * Every claim here has to stay true of the product: no invented statistics,
 * testimonials or partner logos. The figures in the example card are labelled
 * as an illustration.
 */

export const dynamic = "force-dynamic";

const SELLERS = ["Amazon", "Best Buy", "Walmart", "Target", "Newegg", "B&H Photo", "eBay", "Noon", "AliExpress"];

const STEPS = [
  {
    n: "01",
    title: "Name the product",
    body: "Type a model, say it out loud, or photograph the box. VFM pins down the exact variant — size, capacity, colour — before it looks at a single price.",
  },
  {
    n: "02",
    title: "It reads the market, live",
    body: "A live web search pulls current listings for that exact item from different sellers, with their real condition, shipping, delivery time and warranty.",
  },
  {
    n: "03",
    title: "You get a verdict",
    body: "Each listing gets a value score out of ten and the reason behind it. Then one plain recommendation: this one, and here's the trade-off you're making.",
  },
];

const WEIGHED: { title: string; body: string; icon: keyof typeof ICONS }[] = [
  { title: "Price, in context", body: "Against the other sellers and the typical market price. A suspiciously low price gets its reason named, not rewarded.", icon: "tag" },
  { title: "Condition", body: "New, refurbished or used — and whether the price actually reflects it.", icon: "box" },
  { title: "Seller trust", body: "Who's selling, how they're rated, and how easy they make returns.", icon: "shield" },
  { title: "Total cost", body: "Shipping included. The sticker price is rarely what you pay.", icon: "receipt" },
  { title: "Delivery", body: "Next-day and a fortnight are not the same product when you need it now.", icon: "truck" },
  { title: "Warranty", body: "A year of cover versus ninety days is worth real money. VFM counts it.", icon: "badge" },
];

const FEATURES: { title: string; body: string; icon: keyof typeof ICONS }[] = [
  { title: "Search with a photo", body: "Snap the product or its box and VFM identifies the exact model for you.", icon: "camera" },
  { title: "Ask follow-ups", body: "“Is the refurbished one worth it?” Answers grounded in the listings it found — and it says when something isn't in them.", icon: "chat" },
  { title: "Save and track", body: "Keep the listings you're weighing up and come back to them later.", icon: "bookmark" },
  { title: "History that's free to reopen", body: "Past comparisons are stored, so opening one again costs nothing and loads instantly.", icon: "clock" },
  { title: "Buying advice, too", body: "Ask a question instead of a product — “should I buy stock in bulk for my shop?” — and get a straight answer.", icon: "spark" },
  { title: "Fast with a keyboard", body: "Press / to search, numbers to jump between sellers, ? for every shortcut.", icon: "keys" },
];

const FAQ = [
  {
    q: "Are the prices live?",
    a: "Yes. Every search runs a live web search at the moment you ask, so you see what sellers are listing right then. Prices move, so it's always worth a final check on the seller's page before you pay.",
  },
  {
    q: "How is the value score decided?",
    a: "Each listing is weighed on price against the others and against the usual market price, condition, seller trust and returns, total cost including shipping, delivery time and warranty. The specific trade-off behind every score is written next to it.",
  },
  {
    q: "Do sellers pay to be ranked higher?",
    a: "No. There are no paid placements — the recommendation comes from the value judgement alone, and it's often not the cheapest listing.",
  },
  {
    q: "Which stores does it search?",
    a: `${SELLERS.slice(0, -1).join(", ")} and ${SELLERS[SELLERS.length - 1]}, among others — whichever trusted sellers actually have that exact product.`,
  },
  {
    q: "Is it free?",
    a: `The Free plan includes ${PLANS.free.searchesPerMonth} searches a month, no card needed. Pro and Premium add more searches, and Premium compares five sellers instead of three.`,
  },
];

export default async function LandingPage() {
  const session = await getCurrentSession();
  const signedIn = Boolean(session);
  const cta = signedIn ? "Open VFM" : "Start comparing — free";

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <ScrollProgress />
      <LandingNav signedIn={signedIn} />

      <main>
        {/* ------------------------------------------------------------ Hero */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-20 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            <div className="lg:col-span-6 min-w-0">
              <Reveal>
                <p className="eyebrow mb-5">Value for money, decided for you</p>
                <h1
                  className="display"
                  style={{ fontSize: "clamp(2.6rem, 6vw, 4.6rem)", color: "var(--ink)", maxWidth: "12ch" }}
                >
                  The cheapest price is rarely the <span style={{ color: "var(--accent)" }}>best value.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-[16.5px] leading-relaxed mt-6 mb-8 max-w-[34rem]" style={{ color: "var(--ink-soft)" }}>
                  VFM compares the same product across real sellers and weighs everything that
                  matters — condition, seller trust, shipping, warranty, delivery — then tells you
                  which listing actually deserves your money, and why.
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <LandingSearch />
                <p className="text-[12.5px] mt-5" style={{ color: "var(--ink-mute)" }}>
                  Free to start — {PLANS.free.searchesPerMonth} searches a month, no card needed.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-6 min-w-0">
              <Reveal delay={0.2}>
                <div className="float-slow">
                  <ExampleComparison />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ Scroll statement */}
        <section className="max-w-5xl mx-auto px-5 md:px-8 py-16 md:py-28">
          <ScrollHighlight
            className="display"
            style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)", color: "var(--ink)", lineHeight: 1.12 }}
            parts={[
              { text: "Every shop shows you a price. Nobody shows you whether it's worth paying. A refurbished bargain with a ninety-day warranty, a cheap listing that takes two weeks, a third-party seller with no returns —" },
              { text: "VFM weighs all of it,", accent: true },
              { text: "so the pick is the one that's genuinely worth it, not just the one that's cheapest." },
            ]}
          />
        </section>

        {/* --------------------------------------------------- How it works */}
        <section id="how" className="scroll-mt-20 px-5 md:px-8">
          <div className="max-w-6xl mx-auto panel px-6 md:px-14 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                {/* Sticks beside the steps while they scroll past, on wide screens. */}
                <div className="lg:sticky lg:top-28">
                  <Reveal>
                    <p className="eyebrow mb-4">How it works</p>
                    <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.8rem)", color: "var(--ink)" }}>
                      Three steps, about twenty seconds.
                    </h2>
                  </Reveal>
                </div>
              </div>
              <ol className="lg:col-span-7 lg:col-start-6 grid gap-12 md:gap-16">
                {STEPS.map((s, i) => (
                  <li key={s.n}>
                    <Reveal delay={0.05 * i}>
                      <div className="flex gap-5 md:gap-7">
                        <span className="numeric text-[13px] pt-2" style={{ color: "var(--accent)" }}>
                          {s.n}
                        </span>
                        <div style={{ borderTop: "1px solid var(--rule-strong)", paddingTop: 18 }} className="flex-1">
                          <h3 className="display mb-3" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", color: "var(--ink)" }}>
                            {s.title}
                          </h3>
                          <p className="text-[15px] leading-relaxed max-w-prose" style={{ color: "var(--ink-soft)" }}>
                            {s.body}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- What we weigh */}
        <section id="weigh" className="scroll-mt-20 max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <Reveal>
            <p className="eyebrow mb-4">What we weigh</p>
            <h2 className="display mb-12 md:mb-16" style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", color: "var(--ink)", maxWidth: "18ch" }}>
              Six things decide whether a price is <span style={{ color: "var(--accent)" }}>worth it.</span>
            </h2>
          </Reveal>
          <div className="grid gap-4 md:gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
            {WEIGHED.map((w, i) => (
              <Reveal key={w.title} delay={0.04 * (i % 3)}>
                <div className="card feature-card p-6 h-full">
                  <IconTile name={w.icon} />
                  <h3 className="display mt-5 mb-2" style={{ fontSize: "1.3rem", color: "var(--ink)" }}>
                    {w.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {w.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- Sellers strip */}
        <section className="py-10 md:py-14" style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
          <p className="eyebrow text-center mb-6 px-5">Searching the stores you already use</p>
          <Marquee items={SELLERS} />
        </section>

        {/* -------------------------------------------------------- Features */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12 md:mb-16 items-end">
            <Reveal className="lg:col-span-7 min-w-0">
              <p className="eyebrow mb-4">Beyond the comparison</p>
              <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", color: "var(--ink)", maxWidth: "16ch" }}>
                Built for the way you actually shop.
              </h2>
            </Reveal>
            <Reveal delay={0.06} className="lg:col-span-5 min-w-0">
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Start from a photo, keep the shortlist, ask the questions a salesperson
                would dodge. Everything stays tied to the listings VFM actually found.
              </p>
            </Reveal>
          </div>
          <div className="grid gap-x-10 gap-y-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={0.04 * (i % 3)}>
                <div className="flex gap-4">
                  <IconTile name={f.icon} />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                      {f.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                      {f.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- Pricing */}
        <section className="px-5 md:px-8">
          <div className="max-w-6xl mx-auto panel px-6 md:px-14 py-16 md:py-20">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
                <div>
                  <p className="eyebrow mb-4">Pricing</p>
                  <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.8rem)", color: "var(--ink)" }}>
                    Start free. Upgrade if you shop a lot.
                  </h2>
                </div>
                <Link href="/pricing" className="landing-link underline">
                  Compare plans in detail
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))" }}>
              {PLAN_ORDER.map((id, i) => {
                const p = PLANS[id];
                return (
                  <Reveal key={id} delay={0.05 * i}>
                    <div className="card p-6 h-full" style={id === "pro" ? { borderColor: "var(--accent)" } : undefined}>
                      <p className="eyebrow mb-3">{p.name}</p>
                      <p className="display" style={{ fontSize: "2.2rem", color: "var(--ink)" }}>
                        {formatPrice(p)}
                        <span className="text-[14px] font-normal" style={{ color: "var(--ink-mute)", fontFamily: "inherit" }}>
                          {p.price > 0 ? " / month" : ""}
                        </span>
                      </p>
                      <p className="text-[13.5px] mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                        {p.searchesPerMonth.toLocaleString()} searches a month &middot; {p.sellersCompared} sellers compared
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- FAQ */}
        <section id="faq" className="scroll-mt-20 max-w-3xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <Reveal>
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="display mb-10" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.8rem)", color: "var(--ink)" }}>
              Good to know.
            </h2>
          </Reveal>
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" style={{ borderBottom: "1px solid var(--rule)" }}>
                <summary className="flex items-center justify-between gap-6 py-5">
                  <span className="text-[16px]" style={{ color: "var(--ink)" }}>
                    {f.q}
                  </span>
                  <svg className="faq-icon flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="text-[14.5px] leading-relaxed pb-6 pr-10" style={{ color: "var(--ink-soft)" }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- Final CTA */}
        <section className="px-5 md:px-8 pb-24">
          <Reveal>
            <div
              className="max-w-6xl mx-auto px-6 md:px-14 py-16 md:py-20 text-center"
              style={{ background: "var(--ink)", borderRadius: "var(--radius-panel)" }}
            >
              <h2 className="display mx-auto" style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)", color: "var(--paper)", maxWidth: "16ch" }}>
                Know it&apos;s worth it <span style={{ color: "#8fd1a8" }}>before you buy.</span>
              </h2>
              <p className="text-[15px] mt-5 mb-9" style={{ color: "#c9c6b8" }}>
                Name a product. Get a verdict in about twenty seconds.
              </p>
              <Link href="/app" className="btn-accent inline-flex items-center" style={{ padding: "13px 26px", minHeight: 48 }}>
                {cta}
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Logo size={18} />
            <span className="text-[13px]" style={{ color: "var(--ink-mute)" }}>
              Is it actually worth the money?
            </span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-6">
            <Link href="/app" className="landing-link">Compare</Link>
            <a href="#how" className="landing-link">How it works</a>
            <Link href="/pricing" className="landing-link">Pricing</Link>
            <a href="#faq" className="landing-link">FAQ</a>
          </nav>
          <p className="text-[12.5px] w-full md:w-auto" style={{ color: "var(--ink-mute)" }}>
            &copy; {new Date().getFullYear()} VFM
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons — line drawings in the accent colour; no emoji (design standards).
// ---------------------------------------------------------------------------

const ICONS = {
  tag: <><path d="M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2L20 11.3l-7.7 7.7z" /><circle cx="8" cy="8" r="1.4" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  badge: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
  camera: <><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /><circle cx="12" cy="13" r="3.2" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  bookmark: <><path d="M6 3.5h12v17l-6-4-6 4z" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
  keys: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></>,
};

function IconTile({ name }: { name: keyof typeof ICONS }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[12px] flex-shrink-0"
      style={{ width: 42, height: 42, background: "var(--accent-wash)", color: "var(--accent)" }}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}
