"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { TransactionStatusService } from "@/lib/transaction-status-service";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldCheck, HeadphonesIcon } from "lucide-react";

/* ── Design tokens ─────────────────────────────────── */
const BG    = "#101418";
const CARD  = "#1d2025";
const CARDHIGH = "#272a2f";
const GREEN = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED = "#bfcab9";
const DIM   = "#899485";

const CHECKLIST = [
  "Item matches the listing description",
  "Item is in the agreed condition",
  "I've arranged the handover location",
];

export default function MarkAsSentPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const router    = useRouter();
  const { user }  = useAuth();
  const { toast } = useToast();

  const [checked, setChecked]   = useState<boolean[]>(CHECKLIST.map(() => false));
  const [loading, setLoading]   = useState(false);

  const allChecked = checked.every(Boolean);

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleConfirm = useCallback(async () => {
    if (!user || !allChecked) return;
    setLoading(true);
    try {
      await TransactionStatusService.confirmShipped(transactionId, user.id);
      toast({ title: "Item marked as sent!", description: "The buyer has been notified." });
      router.push(`/transactions/${transactionId}`);
    } catch {
      toast({ title: "Error", description: "Could not update status. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, allChecked, transactionId, toast, router]);

  return (
    <div
      className="min-h-dvh pb-10"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#e1e2e9" }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Ready to Hand Over?
        </h1>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto space-y-8">

        {/* Payout info */}
        <section className="rounded-[11px] overflow-hidden" style={{ background: CARD }}>
          <div className="p-5 border-b " style={{ borderColor: "rgba(64,73,61,0.15)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: DIM }}>
              Escrow Held
            </p>
            <p className="font-bold text-2xl" style={{ color: GREEN_L, fontFamily: "Raleway, sans-serif" }}>
              Funds will be released to you
            </p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-[11px] leading-normal" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              After buyer confirms receipt (or 48h auto-release)
            </p>
          </div>
        </section>

        {/* Checklist */}
        <section className="rounded-[11px] p-6 space-y-5" style={{ background: CARD }}>
          {CHECKLIST.map((label, i) => {
            const done = checked[i];
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="flex items-center gap-4 w-full text-left group"
              >
                <div
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: done ? GREEN : "#40493d",
                    background: done ? "rgba(56,142,60,0.15)" : "transparent",
                  }}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M5 13l4 4L19 7" stroke={GREEN_L} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-[15px] font-medium" style={{ color: done ? "#fff" : MUTED, fontFamily: "Raleway, sans-serif" }}>
                  {label}
                </p>
              </button>
            );
          })}
        </section>

        {/* CTA */}
        <section className="space-y-4">
          <button
            onClick={handleConfirm}
            disabled={!allChecked || loading}
            className="w-full py-5 rounded-full font-bold text-base transition-all active:scale-95"
            style={{
              background: allChecked && !loading ? GREEN : CARDHIGH,
              color: allChecked && !loading ? "#fff" : DIM,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              boxShadow: allChecked && !loading ? "0 0 24px rgba(56,142,60,0.35)" : "none",
              cursor: allChecked && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Confirming…" : "Confirm Item Sent / Ready"}
          </button>
          <p className="text-center text-[12px] leading-relaxed px-8" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
            Once confirmed, the 48h buyer confirmation window begins.
          </p>
        </section>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div
            className="p-4 rounded-xl border-l-2"
            style={{ background: "#191c21", borderColor: "#6edf51" }}
          >
            <ShieldCheck className="w-5 h-5 mb-2" style={{ color: "#6edf51" }} />
            <h3 className="text-sm font-bold text-white">Escrow Secure</h3>
            <p className="text-[11px] mt-1" style={{ color: DIM }}>
              Funds are held safely by the platform until handover.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "#191c21" }}>
            <HeadphonesIcon className="w-5 h-5 mb-2" style={{ color: "#a5c8ff" }} />
            <h3 className="text-sm font-bold text-white">Need Help?</h3>
            <p className="text-[11px] mt-1" style={{ color: DIM }}>
              Contact support if the buyer is a no-show.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
