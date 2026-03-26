"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";
import { onboardingAnalytics } from "@/lib/onboarding-analytics";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

/* ─────────────────────────────────────────────
   Design tokens (hard-coded per Stitch spec)
───────────────────────────────────────────── */
const BG            = "#15181D";
const CARD          = "#1d2025";
const CARD_HIGH     = "#272a2f";
const GREEN         = "#82DB7E";
const GREEN_DARK    = "#4da24e";
const GREEN_CTA     = "#388E3C";
const MUTED         = "#bfcab9";
const DIM           = "#899485";

/* ─────────────────────────────────────────────
   Slide definitions
───────────────────────────────────────────── */
const SLIDES = [
  {
    id: "loop",
    title: "Stay in the Loop",
    body: "Connect with neighbors, share local stories, and discover what's happening right on your block.",
  },
  {
    id: "trade",
    title: "Trade Locally",
    body: "List items for sale or find deals from neighbours. No shipping — it's all local.",
  },
  {
    id: "business",
    title: "Discover Businesses",
    body: "Find trusted local businesses, browse their catalog, and chat directly with the owner.",
  },
  {
    id: "connect",
    title: "Connect & Grow",
    body: "Add neighbours as friends, share what matters, and build your local network on Yrdly.",
  },
] as const;

/* ─────────────────────────────────────────────
   Progress dots component
───────────────────────────────────────────── */
function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            className="flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width:  done ? 16 : active ? 12 : 10,
              height: done ? 16 : active ? 12 : 10,
              background: done || active ? GREEN : "#32353a",
              boxShadow: active ? `0 0 12px rgba(130,219,126,0.6)` : "none",
            }}
          >
            {done && <Check className="w-2 h-2" style={{ color: "#003207" }} strokeWidth={3} />}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide illustrations
───────────────────────────────────────────── */

function Slide1Illustration() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(130,219,126,0.12) 0%, transparent 70%)` }} />
      {/* Secondary ghost card */}
      <div
        className="absolute rounded-xl w-72 border"
        style={{
          background: "#191c21",
          borderColor: "rgba(64,73,61,0.2)",
          height: "100%",
          top: -14,
          left: -20,
          transform: "rotate(-6deg)",
          opacity: 0.4,
          zIndex: 0,
        }}
      />
      {/* Main PostCard */}
      <div
        className="relative rounded-xl p-4 w-72 shadow-2xl border"
        style={{
          background: CARD,
          borderColor: "rgba(64,73,61,0.25)",
          transform: "rotate(2deg)",
          zIndex: 1,
        }}
      >
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GREEN_DARK }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
          <div>
            <p className="font-bold text-sm text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Amara Okafor</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Lekki Phase 1 • 2m ago</p>
          </div>
        </div>
        {/* Post image */}
        <div className="w-full aspect-video rounded-lg mb-3 overflow-hidden" style={{ background: CARD_HIGH }}>
          <div className="w-full h-full flex items-center justify-center text-4xl">🏮</div>
        </div>
        {/* Post text */}
        <p className="text-xs text-left leading-relaxed mb-4" style={{ color: "rgba(225,226,233,0.8)", fontFamily: "Work Sans, sans-serif" }}>
          Is anyone else going to the Street Festival this weekend? Let&apos;s meet at the corner! 🏮
        </p>
        {/* Engagement row */}
        <div className="flex gap-4 pt-3" style={{ borderTop: "1px solid rgba(64,73,61,0.2)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} className="w-4 h-4 ml-auto"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </div>
      </div>
    </div>
  );
}

function Slide2Illustration() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-72 h-48 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(130,219,126,0.1) 0%, transparent 70%)` }} />
      {/* Ghost card */}
      <div
        className="absolute w-64 h-24 rounded-[11px] -z-10 opacity-40"
        style={{ background: "rgba(29,32,37,0.4)", transform: "translate(48px,64px) rotate(12deg)", filter: "blur(1px)" }}
      />
      {/* Main marketplace card */}
      <div
        className="relative rounded-[11px] p-4 w-72 shadow-2xl border"
        style={{ background: CARD, borderColor: "rgba(64,73,61,0.2)", transform: "rotate(-10deg)" }}
      >
        {/* SOLD badge */}
        <div
          className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg"
          style={{ background: GREEN, color: "#003207", fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          Sold
        </div>
        <div className="flex items-start gap-4">
          {/* Item thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: CARD_HIGH }}>
            📱
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Raleway, sans-serif" }}>Used iPhone 13</h3>
            <p className="font-bold text-lg" style={{ color: GREEN, fontFamily: "Raleway, sans-serif" }}>₦280,000</p>
            <div className="flex items-center gap-1" style={{ color: DIM }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ fontFamily: "Work Sans, sans-serif" }}>Lagos Island</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid rgba(64,73,61,0.15)" }}>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ background: CARD_HIGH, borderColor: CARD, color: "#fff" }}>A</div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2" style={{ background: CARD_HIGH, borderColor: CARD, color: MUTED }}>+4</div>
          </div>
          <span className="text-[10px] italic" style={{ color: DIM }}>2 hours ago</span>
        </div>
      </div>
    </div>
  );
}

function Slide3Illustration() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute -inset-4 rounded-full pointer-events-none" style={{ background: `rgba(130,219,126,0.08)`, filter: "blur(60px)" }} />
      {/* Business card */}
      <div
        className="relative rounded-[11px] p-5 shadow-2xl border w-72"
        style={{ background: CARD, borderColor: "rgba(64,73,61,0.15)", transform: "rotate(-12deg)" }}
      >
        <div className="flex items-start gap-4 mb-4">
          {/* Business logo */}
          <div className="w-14 h-14 rounded-full border-2 flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl" style={{ borderColor: GREEN_DARK, background: CARD_HIGH }}>
            👩‍🍳
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm leading-tight mb-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Mama Titi&apos;s Kitchen</h3>
            <div className="flex gap-0.5 mb-1">
              {[1,2,3,4].map(i => <span key={i} className="text-sm" style={{ color: GREEN }}>★</span>)}
              <span className="text-sm" style={{ color: DIM }}>★</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: MUTED }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span className="text-[11px]" style={{ fontFamily: "Work Sans, sans-serif" }}>Surulere, Lagos</span>
            </div>
          </div>
        </div>
        {/* Open Now chip */}
        <div
          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-5"
          style={{ background: "#06171B", border: "1px solid #388E3C", color: "#BBF7D0" }}
        >
          Open Now
        </div>
        {/* Catalog row */}
        <div className="flex gap-3">
          {["🍛", "🍲", "🥗"].map((emoji, i) => (
            <div key={i} className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl border" style={{ background: CARD_HIGH, borderColor: "rgba(64,73,61,0.3)" }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
      {/* Floating chat bubble */}
      <div
        className="absolute -bottom-2 -right-2 p-3 rounded-xl border shadow-xl"
        style={{ background: "rgba(0,110,201,0.35)", backdropFilter: "blur(8px)", borderColor: "rgba(165,200,255,0.2)", transform: "rotate(5deg)", zIndex: 2 }}
      >
        <svg viewBox="0 0 24 24" fill="#a5c8ff" className="w-5 h-5"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </div>
    </div>
  );
}

function Slide4Illustration() {
  return (
    <div className="relative flex items-center justify-center h-40">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(130,219,126,0.15) 0%, transparent 70%)` }} />
      <div className="relative w-64 h-40 flex items-center justify-between">
        {/* Avatar 1 */}
        <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl" style={{ background: GREEN, border: `2px solid #003207` }}>
          👨🏾
        </div>
        {/* SVG arc */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
            <path d="M10 50C10 50 50 10 100 10C150 10 190 50 190 50" stroke={GREEN} strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          {/* Check badge at midpoint */}
          <div className="absolute" style={{ top: 2, left: "50%", transform: "translateX(-50%)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: GREEN }}>
              <Check className="w-3.5 h-3.5" style={{ color: "#003207" }} strokeWidth={3} />
            </div>
          </div>
        </div>
        {/* Avatar 2 */}
        <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl" style={{ background: GREEN, border: `2px solid #003207` }}>
          👩🏾
        </div>
      </div>
    </div>
  );
}

const ILLUSTRATIONS = [
  <Slide1Illustration key="0" />,
  <Slide2Illustration key="1" />,
  <Slide3Illustration key="2" />,
  <Slide4Illustration key="3" />,
];

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function OnboardingTourPage() {
  const { completeTour, skipTour } = useOnboarding();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const isLast = step === SLIDES.length - 1;

  const goTo = (next: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  const handleNext = async () => {
    if (isLast) {
      try {
        onboardingAnalytics.trackTourCompleted(SLIDES.length, SLIDES.length);
        await completeTour();
      } catch {}
      router.push("/home");
    } else {
      goTo(step + 1);
    }
  };

  const handleBack = () => { if (step > 0) goTo(step - 1); };

  const handleSkip = async () => {
    try {
      onboardingAnalytics.trackTourSkipped("user_skipped");
      await skipTour();
    } catch {}
    router.push("/home");
  };

  const slide = SLIDES[step];

  return (
    <div className="min-h-dvh flex flex-col overflow-hidden" style={{ background: BG, fontFamily: "Work Sans, sans-serif", color: "#e1e2e9" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-8 relative">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all"
          style={{ visibility: step > 0 ? "visible" : "hidden", background: "transparent" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: MUTED }} />
        </button>

        {/* Dots — centred absolutely */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Dots current={step} total={SLIDES.length} />
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="text-sm font-medium transition-colors"
          style={{ color: MUTED, fontFamily: "Work Sans, sans-serif" }}
        >
          Skip
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 relative">

        {/* Atmospheric glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 rounded-full pointer-events-none -z-10" style={{ background: "rgba(130,219,126,0.08)", filter: "blur(120px)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-2/5 h-2/5 rounded-full pointer-events-none -z-10" style={{ background: "rgba(0,110,201,0.06)", filter: "blur(100px)" }} />

        {/* Illustration */}
        <div
          className="mb-14 transition-all duration-300"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(12px)" : "translateY(0)" }}
        >
          {ILLUSTRATIONS[step]}
        </div>

        {/* Text */}
        <div
          className="text-center max-w-xs transition-all duration-300"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)" }}
        >
          <h1
            className="mb-4 leading-tight"
            style={{ fontFamily: "Pacifico, cursive", fontSize: 28, color: "#fff" }}
          >
            {slide.title}
          </h1>
          <p
            className="leading-relaxed text-sm font-light"
            style={{ color: "#BBBBBB", fontFamily: "Raleway, sans-serif" }}
          >
            {slide.body}
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full px-8 pb-14">
        {isLast ? (
          /* Last slide: full-width "Get Started" */
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleNext}
              className="w-full max-w-sm py-5 rounded-full font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_20px_40px_rgba(130,219,126,0.2)]"
              style={{ background: GREEN, color: "#003207", fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Get Started 🎉
            </button>
            <p className="text-xs text-center" style={{ color: "#BBBBBB", fontFamily: "Raleway, sans-serif" }}>
              Already have an account?{" "}
              <button onClick={() => router.push("/login")} className="font-semibold" style={{ color: "#4DA24E" }}>
                Log in
              </button>
            </p>
          </div>
        ) : (
          /* Other slides: Next button right-aligned */
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-all active:scale-95 shadow-[0_10px_30px_rgba(130,219,126,0.25)]"
              style={{ background: GREEN, color: "#003207", fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
