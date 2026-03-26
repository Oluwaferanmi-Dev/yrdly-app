"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/* ── Design tokens ─────────────────────────────────────── */
const BG   = "#191c21";
const GREEN = "#388E3C";
const DIM  = "#bfcab9";

export default function PaymentRedirectPage() {
  const params = useSearchParams();
  const link   = params.get("link");

  /* Auto-redirect once the page mounts */
  useEffect(() => {
    if (link) {
      const t = setTimeout(() => { window.location.href = link; }, 1500);
      return () => clearTimeout(t);
    }
  }, [link]);

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-center px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <span
          style={{
            fontFamily: "Jersey 25, cursive",
            color: "#259907",
            fontSize: 28,
          }}
        >
          Yrdly
        </span>
      </header>

      {/* Center content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-8 max-w-xs">

          {/* Spinner */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full border-4"
              style={{ borderColor: "#32353a" }}
            />
            <div
              className="absolute w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${GREEN} transparent transparent transparent` }}
            />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1
              style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}
            >
              Connecting to Flutterwave...
            </h1>
            <p className="text-sm" style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}>
              Please do not close this screen
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#32353a" }}>
            <div
              className="h-full rounded-full"
              style={{
                background: GREEN,
                width: "40%",
                animation: "progress 2.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Footer lock */}
        <footer className="absolute bottom-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5" style={{ color: "#899485" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <span
              className="text-[11px] uppercase tracking-widest"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              Secured payment
            </span>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes progress {
          0%   { width: 10%; }
          50%  { width: 70%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
}
