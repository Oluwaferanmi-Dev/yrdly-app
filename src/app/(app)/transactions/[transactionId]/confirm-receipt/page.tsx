"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { TransactionStatusService } from "@/lib/transaction-status-service";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react";

/* ── Design tokens ─────────────────────────────────── */
const BG      = "#101418";
const CARD    = "#1d2025";
const GREEN   = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED   = "#bfcab9";
const RED     = "#E53935";

export default function ConfirmReceiptPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const router    = useRouter();
  const { user }  = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Step 1: Confirm delivery received
      await TransactionStatusService.confirmDelivered(transactionId, user.id);
      // Step 2: Immediately complete the transaction and release funds
      await TransactionStatusService.completeTransaction(transactionId);
      toast({ title: "Receipt confirmed!", description: "Funds have been released to the seller." });
      router.push(`/transactions/${transactionId}`);
    } catch {
      toast({ title: "Error", description: "Could not confirm receipt. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, transactionId, toast, router]);

  return (
    <div
      className="min-h-dvh"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Ambient glows */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "rgba(130,219,126,0.05)", filter: "blur(120px)" }} />
      <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "rgba(165,200,255,0.05)", filter: "blur(120px)" }} />

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16 max-w-2xl mx-auto left-0 right-0"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN_L }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Did You Receive It?
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-2xl mx-auto flex flex-col items-center">

        {/* SVG countdown ring (static visual) */}
        <div className="relative flex flex-col items-center mb-10">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="88" cy="88" r="82" fill="none" stroke="#1d2025" strokeWidth="6" />
              <circle
                cx="88" cy="88" r="82" fill="none"
                stroke={GREEN_L} strokeWidth="6" strokeLinecap="round"
                strokeDasharray="515" strokeDashoffset="120"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontFamily: "Jersey 25, cursive", fontSize: 36, color: GREEN_L, lineHeight: 1 }}>
                48:00:00
              </span>
            </div>
          </div>
          <p
            className="text-[11px] mt-4 uppercase tracking-widest text-center"
            style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
          >
            Remaining to confirm or auto-release
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
          {/* All good */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-col items-center p-6 rounded-lg border-2 transition-all text-center active:scale-[0.98] group"
            style={{
              background: CARD,
              borderColor: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#35a61a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(110,223,81,0.1)" }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: "#6edf51", fill: "#6edf51", fillOpacity: 0.2 }} />
            </div>
            <h4 className="font-bold text-sm text-white mb-1" style={{ fontFamily: "Raleway, sans-serif" }}>
              All Good!
            </h4>
            <p className="text-xs mb-6" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              Item received in good condition
            </p>
            <div
              className="mt-auto w-full py-2.5 px-6 rounded-full font-bold text-sm"
              style={{
                background: "#35a61a",
                color: "#fff",
                fontFamily: "Raleway, sans-serif",
                boxShadow: "0 8px 20px rgba(53,166,26,0.2)",
              }}
            >
              {loading ? "Confirming…" : "Confirm Receipt"}
            </div>
          </button>

          {/* Problem */}
          <button
            onClick={() => router.push(`/transactions/${transactionId}/dispute`)}
            className="flex flex-col items-center p-6 rounded-lg border-2 transition-all text-center active:scale-[0.98]"
            style={{ background: CARD, borderColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = RED)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(255,180,171,0.1)" }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: "#ffb4ab" }} />
            </div>
            <h4 className="font-bold text-sm text-white mb-1" style={{ fontFamily: "Raleway, sans-serif" }}>
              There&apos;s an issue
            </h4>
            <p className="text-xs mb-6" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              Not as described / missing items
            </p>
            <div
              className="mt-auto w-full py-2.5 px-6 rounded-full font-bold text-sm"
              style={{
                border: `1px solid ${RED}`,
                color: RED,
                fontFamily: "Raleway, sans-serif",
              }}
            >
              Raise Dispute
            </div>
          </button>
        </div>

        {/* Fine print */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{ background: "rgba(39,42,47,0.3)", borderColor: "rgba(64,73,61,0.15)" }}
        >
          <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
          <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
            If you take no action in 48h, funds will be auto-released to the seller.
          </p>
        </div>
      </main>
    </div>
  );
}
