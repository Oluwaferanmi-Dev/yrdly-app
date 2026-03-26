"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, MessageCircle, Receipt } from "lucide-react";

/* ── Design tokens ─────────────────────────────────── */
const BG     = "#101418";
const CARD   = "#1d2025";
const GREEN  = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";

const STEPS = [
  { label: "Seller prepares your item", sub: "Notification sent to the seller" },
  { label: "Seller marks item as sent" },
  { label: "You confirm receipt" },
  { label: "Funds released to seller" },
];

export default function EscrowConfirmationPage() {
  const params        = useSearchParams();
  const router        = useRouter();
  const transactionId = params.get("txn") ?? "";
  const amount        = params.get("amount") ?? "0";
  const itemTitle     = params.get("item") ?? "Your item";
  const ref           = params.get("ref") ?? `YRD${Date.now().toString().slice(-5)}`;

  const fmt = (n: string) =>
    `₦${Number(n).toLocaleString("en-NG")}`;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => router.push("/marketplace")}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN_L }} />
        </button>
        <span
          style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: GREEN_L }}
        >
          Checkout
        </span>
      </header>

      <main
        className="flex-1 pt-24 pb-36 px-6 max-w-lg mx-auto w-full space-y-10"
        style={{ overflowY: "auto" }}
      >
        {/* Success icon */}
        <section className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: GREEN,
                animation: "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            />
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
              style={{
                background: "rgba(56,142,60,0.15)",
                border: `2px solid ${GREEN}`,
              }}
            >
              <Check className="w-8 h-8" style={{ color: GREEN }} strokeWidth={3} />
            </div>
          </div>

          <h2
            className="leading-tight mb-2"
            style={{ fontFamily: "Pacifico, cursive", fontSize: 26, color: "#fff" }}
          >
            Payment Secured!
          </h2>
          <p className="text-sm font-medium" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
            {fmt(amount)} is held safely in escrow
          </p>
        </section>

        {/* Item recap */}
        <article
          className="rounded-[11px] p-4 flex items-center gap-4"
          style={{ background: CARD }}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate text-sm">{itemTitle}</h3>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: MUTED, fontFamily: "Raleway, sans-serif", fontVariantNumeric: "tabular-nums" }}
            >
              Ref: #{ref}
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex-shrink-0"
            style={{
              background: "rgba(56,142,60,0.15)",
              color: GREEN_L,
              border: `1px solid ${GREEN}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: GREEN_L, animation: "pulse 1.5s ease-in-out infinite" }}
            />
            IN ESCROW
          </span>
        </article>

        {/* Timeline */}
        <section className="space-y-6">
          <h4
            className="text-[12px] font-bold uppercase tracking-widest"
            style={{ color: DIM }}
          >
            What Happens Next
          </h4>

          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute left-4 top-4 bottom-4 w-px"
              style={{ background: "rgba(64,73,61,0.3)" }}
            />

            <div className="space-y-8 relative">
              {STEPS.map((step, i) => {
                const active = i === 0;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-5"
                    style={{ opacity: active ? 1 : 0.35 }}
                  >
                    <div className="relative">
                      {active && (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: "rgba(56,142,60,0.4)", filter: "blur(8px)" }}
                        />
                      )}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm relative z-10"
                        style={{
                          border: `2px solid ${active ? GREEN : "#40493d"}`,
                          background: active ? "rgba(39,42,47,1)" : "#1d2025",
                          color: active ? GREEN_L : MUTED,
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>
                    <div className="pt-1">
                      <p className="text-white font-semibold text-sm">{step.label}</p>
                      {step.sub && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(191,202,185,0.7)" }}>
                          {step.sub}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer actions */}
      <footer
        className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #101418 60%, transparent)",
        }}
      >
        <div className="max-w-lg mx-auto flex flex-col gap-3 pointer-events-auto">
          <button
            onClick={() =>
              router.push(
                `/messages/marketplace/${transactionId || "new"}`
              )
            }
            className="w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: GREEN,
              color: "#fff",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              boxShadow: "0 10px 30px rgba(56,142,60,0.25)",
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Message Seller
          </button>
          <button
            onClick={() =>
              router.push(`/transactions/${transactionId}`)
            }
            className="w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              border: `1px solid ${GREEN}`,
              color: GREEN_L,
              background: "rgba(21,24,29,0.6)",
              backdropFilter: "blur(8px)",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            <Receipt className="w-5 h-5" />
            View Transaction
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
