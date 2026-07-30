"use client";

import { useState, useId } from "react";
import VfmBar from "./VfmBar";
import PaymentPlans from "./PaymentPlans";
import type { Listing } from "@/types";

const RANK_CONFIG = [
  { rank: 1, color: "#2dbe5f", icon: "🥇" },
  { rank: 2, color: "#f59e0b", icon: "🥈" },
  { rank: 3, color: "#a78bfa", icon: "🥉" },
];

export default function SellerCard({
  listing,
  rank,
  isRecommended,
  isSaved,
  onSave,
  isTracked,
  onTrack,
}: {
  listing: Listing;
  rank: number;
  /** True for the listing the AI actually picked — not necessarily rank 1. */
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
  const rc = RANK_CONFIG.find((r) => r.rank === rank) || RANK_CONFIG[2];

  const hasBuyUrl = Boolean(listing.buyUrl);

  return (
    <div
      className="card-hover relative rounded-[18px] p-5"
      style={{
        background: "#111815",
        border: `1px solid ${isRecommended ? rc.color + "38" : "rgba(45,190,95,0.09)"}`,
        animation: "fadeUp .5s ease both",
      }}
    >
      {isRecommended && (
        <div
          className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-0.5 text-[10px] font-extrabold tracking-wider"
          style={{ background: `linear-gradient(90deg,#2dbe5f,#1d9648)`, color: "#000" }}
        >
          ✦ VFM PICK
        </div>
      )}

      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        <button
          onClick={onSave}
          aria-pressed={isSaved}
          aria-label={
            isSaved ? `Remove ${listing.store} listing from saved` : `Save ${listing.store} listing`
          }
          title={isSaved ? "Remove from saved" : "Save product"}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs transition-all"
          style={{
            background: isSaved ? "#2dbe5f22" : "#0f1410",
            border: `1px solid ${isSaved ? "#2dbe5f60" : "rgba(45,190,95,0.09)"}`,
            color: isSaved ? "#2dbe5f" : "#3d5542",
          }}
        >
          <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span>
        </button>
        <button
          onClick={onTrack}
          aria-pressed={isTracked}
          aria-label={
            isTracked
              ? `Stop tracking the price at ${listing.store}`
              : `Track price drops at ${listing.store}`
          }
          title={isTracked ? "Stop price tracking" : "Track price drops"}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] transition-all"
          style={{
            background: isTracked ? "#f59e0b22" : "#0f1410",
            border: `1px solid ${isTracked ? "#f59e0b60" : "rgba(45,190,95,0.09)"}`,
            color: isTracked ? "#f59e0b" : "#3d5542",
          }}
        >
          <span aria-hidden="true">🔔</span>
        </button>
      </div>

      <div className="flex gap-3 items-start" style={{ marginTop: isRecommended ? 8 : 0 }}>
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-[26px] flex-shrink-0 overflow-hidden"
          style={{ background: `${rc.color}12`, border: `1px solid ${rc.color}22` }}
        >
          {!imgErr && listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt=""
              loading="lazy"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover rounded-[11px]"
            />
          ) : (
            <span aria-hidden="true">{listing.emoji || "📦"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0" style={{ paddingRight: 56 }}>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[15px]" aria-hidden="true">
              {rc.icon}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: rc.color }}>
              {listing.store}
            </span>
            {listing.condition && listing.condition !== "New" && (
              <span
                className="text-[9px] rounded-full px-[7px] py-[1px]"
                style={{ background: "#f59e0b18", color: "#f59e0b", border: "1px solid #f59e0b30" }}
              >
                {listing.condition}
              </span>
            )}
          </div>
          <div
            className="text-[21px] font-extrabold leading-tight"
            style={{ color: rc.color, fontFamily: "JetBrains Mono, monospace" }}
          >
            {listing.price}
          </div>
          {listing.originalPrice && (
            <div className="text-[11px]" style={{ color: "#3d5542" }}>
              <span className="line-through">{listing.originalPrice}</span>
              <span className="sr-only"> was the original price</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 my-3">
        {[
          { icon: "🚚", label: "Shipping", val: listing.shipping },
          { icon: "📦", label: "Delivery", val: listing.delivery },
          { icon: "🛡️", label: "Warranty", val: listing.warranty },
          {
            icon: "⭐",
            label: "Seller",
            val: typeof listing.sellerRating === "number" ? `${listing.sellerRating}/5` : undefined,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(45,190,95,0.05)" }}>
            <div className="text-[9px] mb-0.5" style={{ color: "#3d5542" }}>
              <span aria-hidden="true">{m.icon}</span> {m.label}
            </div>
            <div className="text-[11px] font-medium" style={{ color: "#8aaa8e" }}>
              {m.val || "Not listed"}
            </div>
          </div>
        ))}
      </div>

      <VfmBar score={listing.valueScore} />

      <div className="flex gap-1.5 mt-2.5">
        {/* A missing buyUrl used to render href="#", which looked clickable and
            silently did nothing. The AI is told to omit the field rather than
            invent a link, so this state is expected. */}
        {hasBuyUrl ? (
          <a
            href={listing.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-jade flex-1 text-center flex items-center justify-center gap-1.5"
          >
            Buy on {listing.store} <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span
            className="flex-1 text-center flex items-center justify-center rounded-[11px] px-5 py-2.5 text-[13px]"
            style={{
              background: "rgba(45,190,95,0.05)",
              border: "1px dashed rgba(45,190,95,0.22)",
              color: "#3d5542",
            }}
            title="The search didn't return a direct link for this listing"
          >
            No direct link found
          </span>
        )}
        <button
          onClick={() => setShowPay((p) => !p)}
          aria-expanded={showPay}
          aria-label="Show payment plans"
          className="btn-ghost px-[11px] py-2 text-[13px]"
          title="Payment plans"
        >
          <span aria-hidden="true">💳</span>
        </button>
      </div>

      {showPay && <PaymentPlans price={listing.price} />}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={analysisId}
        className="w-full mt-2 py-1.5 rounded-[10px] text-[11px] transition-colors"
        style={{ background: "none", border: "1px solid rgba(45,190,95,0.09)", color: "#3d5542" }}
      >
        {open ? "▲ Less" : "▼ AI Analysis"}
      </button>

      {open && (
        <div id={analysisId} className="mt-2.5" style={{ animation: "fadeUp .3s ease" }}>
          {listing.pros?.length || listing.cons?.length ? (
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div
                className="rounded-[10px] p-2.5"
                style={{ background: "rgba(45,190,95,0.07)", border: "1px solid rgba(45,190,95,0.15)" }}
              >
                <div className="text-[9px] font-bold mb-1.5 tracking-wider" style={{ color: "#2dbe5f" }}>
                  PROS
                </div>
                {(listing.pros || []).map((p, i) => (
                  <div key={i} className="text-[11px] mb-0.5" style={{ color: "#8aaa8e" }}>
                    <span aria-hidden="true">✓</span> {p}
                  </div>
                ))}
              </div>
              <div
                className="rounded-[10px] p-2.5"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)" }}
              >
                <div className="text-[9px] font-bold mb-1.5 tracking-wider" style={{ color: "#ef4444" }}>
                  CONS
                </div>
                {(listing.cons || []).map((c, i) => (
                  <div key={i} className="text-[11px] mb-0.5" style={{ color: "#8aaa8e" }}>
                    <span aria-hidden="true">✗</span> {c}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {listing.aiReason && (
            <div
              className="rounded-[10px] px-[11px] py-2.5 text-xs leading-relaxed"
              style={{
                background: "rgba(45,190,95,0.05)",
                border: "1px solid rgba(45,190,95,0.18)",
                borderLeft: "2px solid #2dbe5f",
                color: "#8aaa8e",
              }}
            >
              <span style={{ color: "#2dbe5f", fontWeight: 600 }}>AI: </span>
              {listing.aiReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
