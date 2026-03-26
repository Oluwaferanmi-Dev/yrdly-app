"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, Clock } from "lucide-react";
import { useState } from "react";

/* ── Design tokens ─────────────────────────────────── */
const BG    = "#101418";
const CARD  = "#1d2025";
const CARDH = "#272a2f";
const GREEN  = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";

const STARS = [1, 2, 3, 4, 5];

export default function PayoutSuccessPage() {
  const params        = useSearchParams();
  const router        = useRouter();
  const transactionId = params.get("txn") ?? "";
  const amount        = params.get("amount") ?? "0";
  const account       = params.get("account") ?? "••• 0000";

  const [rating, setRating]   = useState(4);
  const [review, setReview]   = useState("");
  const [submitted, setSubmit] = useState(false);

  const fmt = (n: string) =>
    `₦${Number(n).toLocaleString("en-NG")}`;

  return (
    <div
      className="min-h-dvh flex flex-col items-center"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Confetti dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #82db7e 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.06,
        }}
      />

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.push("/marketplace")} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Checkout
        </h1>
      </header>

      <main className="w-full max-w-md px-6 pt-24 pb-12 flex flex-col items-center relative">

        {/* Success icon */}
        <div className="relative mb-8 flex justify-center items-center">
          <div
            className="absolute w-32 h-32 rounded-full"
            style={{ background: "rgba(130,219,126,0.15)", filter: "blur(48px)" }}
          />
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border-2"
            style={{
              background: CARDH,
              borderColor: GREEN_L,
              boxShadow: "0 0 30px rgba(130,219,126,0.25)",
            }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: GREEN_L, fill: "rgba(130,219,126,0.2)" }} />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2 mb-10 z-10">
          <h2 style={{ fontFamily: "Pacifico, cursive", fontSize: 28, color: "#fff" }}>
            {amount !== "0" ? `${fmt(amount)} Sent!` : "Payout Sent!"}
          </h2>
          <p className="text-[13px]" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
            Transferred to your account {account}
          </p>
          <div
            className="inline-flex items-center px-3 py-1 rounded-full mt-4 gap-1.5"
            style={{ background: "rgba(110,223,81,0.1)", border: "1px solid rgba(110,223,81,0.2)" }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: "#6edf51" }} />
            <span
              className="font-semibold text-[11px] uppercase tracking-wider"
              style={{ color: "#6edf51", fontFamily: "Raleway, sans-serif" }}
            >
              Arrives within 24 hours
            </span>
          </div>
        </div>

        {/* Transaction card */}
        <div
          className="w-full rounded-xl p-5 mb-10 border"
          style={{ background: CARD, borderColor: "rgba(64,73,61,0.15)" }}
        >
          <div className="flex justify-between text-[11px] mb-2">
            <span style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}>Ref Number</span>
            <span style={{ color: "#e1e2e9" }}>
              #{transactionId ? transactionId.slice(0, 10).toUpperCase() : "TXN-XXXXX"}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}>Date</span>
            <span style={{ color: "#e1e2e9" }}>
              {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Review section */}
        {!submitted ? (
          <section className="w-full flex flex-col items-center">
            <h3
              className="font-bold text-sm text-white mb-6"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              How was your experience?
            </h3>

            {/* Stars */}
            <div className="flex gap-3 mb-8">
              {STARS.map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill={s <= rating ? "#FFD700" : "none"} stroke={s <= rating ? "#FFD700" : DIM} strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Review textarea */}
            <div className="w-full mb-8">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell others about your experience (optional)..."
                rows={3}
                className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none"
                style={{
                  background: CARDH,
                  color: "#e1e2e9",
                  fontFamily: "Raleway, sans-serif",
                  border: "1px solid rgba(130,219,126,0.15)",
                }}
              />
            </div>

            <div className="w-full flex flex-col items-center gap-4">
              <button
                onClick={() => setSubmit(true)}
                className="w-full py-4 rounded-full font-bold text-base transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${GREEN_L}, #4da24e)`,
                  color: "#003207",
                  fontFamily: "Raleway, sans-serif",
                  boxShadow: "0 8px 24px rgba(130,219,126,0.15)",
                }}
              >
                Submit Review
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="text-sm py-2 px-6 hover:text-white transition-colors"
                style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}
              >
                Skip
              </button>
            </div>
          </section>
        ) : (
          <div className="w-full text-center space-y-4">
            <CheckCircle className="w-10 h-10 mx-auto" style={{ color: GREEN_L }} />
            <p className="font-bold text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
              Thanks for your review!
            </p>
            <button
              onClick={() => router.push("/marketplace")}
              className="w-full py-4 rounded-full font-bold"
              style={{ background: GREEN, color: "#fff", fontFamily: "Raleway, sans-serif" }}
            >
              Back to Marketplace
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
