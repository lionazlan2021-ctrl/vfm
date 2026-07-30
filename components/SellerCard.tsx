"use client";

import { useState, useId } from "react";
import VfmBar from "./VfmBar";
import PaymentPlans from "./PaymentPlans";
import type { Listing } from "@/types";

export default function SellerCard({
  listing,
  isRecommended,
  isSaved,
  onSave,
  isTracked,
  onTrack,
}: {
  listing: Listing;
  /** True for the listing the AI actually picked — not necessarily the first. */
  isRecommended: boolean;
  isSaved: boolean;
  onSave: () => void;
  isTracked: boolean;
  onTrack: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const ids = useId();
  const analysisId = `${ids}-analysis`;

  const isSecondhand = Boolean(listing.condition && listing.condition !== "New");

  const facts: [string, string | undefined][] = [
    ["Shipping", listing.shipping],
    ["Delivery", listing.delivery],
    ["Warranty", listing.warranty],
    ["Seller rating", typeof listing.sellerRating === "number" ? `${listing.sellerRating} / 5` : undefined],
  ];

  return (
    <article
      className="card relative flex flex-col p-5 md:p-6"
      style={{
        // The pick is marked with a heavier rule, not a glow or a gradient.
        borderColor: isRecommended ? "var(--accent)" : "var(--rule)",
        borderWidth: isRecommended ? 1.5 : 1,
        animation: "riseIn .4s ease both",
      }}
    >
      {isRecommended && (
        <div
          className="absolute -top-[9px] left-5 px-2.5 py-[2px] rounded-full eyebrow"
          style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.1em" }}
        >
          Best value
        </div>
      )}

      <header className="flex items-start justify-between gap-3 mt-1">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold truncate" style={{ color: "var(--ink)" }}>
            {listing.store}
          </h3>
          {isSecondhand && (
            <span
              className="inline-block mt-1.5 text-[11px] px-2 py-[1px] rounded-full"
              style={{ background: "var(--flag-wash)", color: "var(--flag)", border: "1px solid var(--flag)" }}
            >
              {listing.condition}
            </span>
          )}
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <IconToggle
            active={isSaved}
            onClick={onSave}
            label={isSaved ? `Remove ${listing.store} listing from saved` : `Save ${listing.store} listing`}
          >
            <HeartIcon filled={isSaved} />
          </IconToggle>
          <IconToggle
            active={isTracked}
            onClick={onTrack}
            label={
              isTracked
                ? `Stop tracking the price at ${listing.store}`
                : `Track price drops at ${listing.store}`
            }
          >
            <BellIcon filled={isTracked} />
          </IconToggle>
        </div>
      </header>

      {/* Price is the headline of the card — serif display, like the reference's
          big data numbers. */}
      <div className="mt-4 flex items-end gap-2.5 flex-wrap">
        <span
          className="display"
          style={{ fontSize: "2.4rem", lineHeight: 1, color: "var(--ink)" }}
        >
          {listing.price}
        </span>
        {listing.originalPrice && (
          <span className="text-[13px] pb-1" style={{ color: "var(--ink-mute)" }}>
            <span className="line-through">{listing.originalPrice}</span>
            <span className="sr-only"> was the original price</span>
          </span>
        )}
      </div>

      {listing.imageUrl && !imgErr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImgErr(true)}
          className="mt-4 w-full h-32 object-contain rounded-lg"
          style={{ background: "var(--panel)" }}
        />
      )}

      {/* Plain mono labels, no icons — the reference labels its data this way. */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow" style={{ fontSize: 10 }}>
              {label}
            </dt>
            <dd className="text-[13px] mt-1" style={{ color: value ? "var(--ink-soft)" : "var(--ink-mute)" }}>
              {value || "Not listed"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <VfmBar score={listing.valueScore} />
      </div>

      <div className="mt-5 flex gap-2">
        {listing.buyUrl ? (
          <a
            href={listing.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn flex-1"
          >
            Buy at {listing.store}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span
            className="flex-1 text-center text-[13px] px-4 py-[11px] rounded-[10px]"
            style={{ border: "1px dashed var(--rule-strong)", color: "var(--ink-mute)" }}
            title="The search didn't return a direct link for this listing"
          >
            No direct link
          </span>
        )}
        <button
          onClick={() => setShowPay((p) => !p)}
          aria-expanded={showPay}
          className="btn-quiet"
          style={{ padding: "9px 14px", minHeight: 44 }}
        >
          Instalments
        </button>
      </div>

      {showPay && <PaymentPlans price={listing.price} />}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={analysisId}
        className="mt-4 pt-4 text-[12.5px] text-left flex items-center justify-between"
        style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-soft)", background: "none" }}
      >
        <span>Why this score</span>
        <span aria-hidden="true" style={{ color: "var(--ink-mute)" }}>
          {open ? "–" : "+"}
        </span>
      </button>

      {open && (
        <div id={analysisId} className="mt-3.5" style={{ animation: "riseIn .3s ease both" }}>
          {listing.aiReason && (
            <p
              className="text-[13px] leading-relaxed pl-3 mb-4"
              style={{ borderLeft: "2px solid var(--accent)", color: "var(--ink-soft)" }}
            >
              {listing.aiReason}
            </p>
          )}
          {(listing.pros?.length || listing.cons?.length) && (
            <div className="grid gap-4">
              {listing.pros?.length ? (
                <div>
                  <p className="eyebrow mb-2" style={{ fontSize: 10 }}>
                    In its favour
                  </p>
                  <ul className="space-y-1.5">
                    {listing.pros.map((p, i) => (
                      <li key={i} className="text-[13px] flex gap-2" style={{ color: "var(--ink-soft)" }}>
                        <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                          +
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {listing.cons?.length ? (
                <div>
                  <p className="eyebrow mb-2" style={{ fontSize: 10 }}>
                    Against it
                  </p>
                  <ul className="space-y-1.5">
                    {listing.cons.map((c, i) => (
                      <li key={i} className="text-[13px] flex gap-2" style={{ color: "var(--ink-soft)" }}>
                        <span aria-hidden="true" style={{ color: "var(--flag)" }}>
                          −
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className="flex items-center justify-center rounded-lg transition-colors"
      style={{
        width: 34,
        height: 34,
        border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
        color: active ? "var(--accent)" : "var(--ink-mute)",
        background: active ? "var(--accent-wash)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20.5 3.9 12.6a5.1 5.1 0 0 1 7.2-7.2l.9.9.9-.9a5.1 5.1 0 0 1 7.2 7.2z" />
    </svg>
  );
}

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}
