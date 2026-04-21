"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, X, AlertTriangle } from "lucide-react";
import { EscrowService } from "@/lib/escrow-service";

/* ── Design tokens ─────────────────────────────────── */
const BG    = "#101418";
const CARD  = "#1d2025";
const CARDLO = "#191c21";
const GREEN = "#388E3C";
const RED   = "#E53935";
const MUTED = "#bfcab9";

const REASONS = [
  "Item not as described",
  "Item not received after meetup",
  "Item is damaged / defective",
  "Seller is unresponsive",
  "Other (provide details)",
];

export default function DisputePage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const router    = useRouter();
  const { user }  = useAuth();
  const { toast } = useToast();

  const [selected, setSelected] = useState(0);
  const [detail, setDetail]     = useState("");
  const [images, setImages]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f);
      setImages((prev) => [...prev.slice(0, 4), url]);
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const reason = `${REASONS[selected]}${detail ? `: ${detail}` : ""}`;
      await EscrowService.disputeTransaction(transactionId, reason);
      toast({ title: "Dispute submitted", description: "Our team will review it within 24–48 hours." });
      router.push(`/transactions/${transactionId}`);
    } catch {
      toast({ title: "Error", description: "Could not submit dispute. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, transactionId, toast, router, selected, detail]);

  return (
    <div
      className="min-h-dvh"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN }} />
        </button>
        <div className="flex items-center gap-2">
          <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
            Raise a Dispute
          </h1>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: RED,
              boxShadow: `0 0 0 4px rgba(229,57,53,0.2)`,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </header>

      <main className="pt-20 pb-10 px-6 max-w-2xl mx-auto space-y-8">

        {/* Warning banner */}
        <section
          className="rounded-[11px] p-4 flex gap-3 items-start border"
          style={{ background: "rgba(229,57,53,0.1)", borderColor: RED }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: RED }} />
          <p className="text-sm leading-snug" style={{ fontFamily: "Raleway, sans-serif" }}>
            Your funds will remain on hold while our team reviews this.
          </p>
        </section>

        {/* Reason selection */}
        <section className="space-y-4">
          <h2
            className="text-[12px] uppercase tracking-widest font-bold px-1"
            style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
          >
            Select a Reason
          </h2>
          <div className="space-y-2">
            {REASONS.map((r, i) => {
              const active = i === selected;
              return (
                <label
                  key={i}
                  className="flex items-center justify-between p-4 rounded-[11px] border-l-4 cursor-pointer transition-all"
                  style={{
                    background: active ? CARD : CARDLO,
                    borderLeftColor: active ? GREEN : "transparent",
                    boxShadow: active
                      ? `0 0 0 1px ${GREEN}`
                      : "none",
                  }}
                >
                  <span
                    className="text-sm"
                    style={{ color: active ? "#fff" : MUTED, fontFamily: "Raleway, sans-serif" }}
                  >
                    {r}
                  </span>
                  <input
                    type="radio"
                    name="dispute_reason"
                    checked={active}
                    onChange={() => setSelected(i)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: GREEN }}
                  />
                </label>
              );
            })}
          </div>
        </section>

        {/* Details */}
        <section className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label
              className="text-[12px] uppercase tracking-widest font-bold"
              style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
            >
              Details
            </label>
            <span className="text-[10px]" style={{ color: "#899485" }}>
              {detail.length} / 150
            </span>
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value.slice(0, 150))}
            placeholder="Tell us what happened..."
            rows={5}
            className="w-full rounded-[11px] p-4 text-sm resize-none focus:outline-none transition-all"
            style={{
              background: "#1B2B3A",
              color: "#e1e2e9",
              fontFamily: "Raleway, sans-serif",
              border: "1px solid transparent",
            }}
            onFocus={(e) => (e.target.style.borderColor = GREEN)}
            onBlur={(e) => (e.target.style.borderColor = "transparent")}
          />
        </section>

        {/* Evidence */}
        <section className="space-y-4">
          <label
            className="text-[12px] uppercase tracking-widest font-bold px-1"
            style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
          >
            Evidence
          </label>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-[11px] flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors"
            style={{ background: CARD, borderColor: "rgba(56,142,60,0.5)", aspectRatio: "4/1" }}
          >
            <Camera className="w-5 h-5" style={{ color: GREEN }} />
            <p className="text-[12px]" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              Upload photos or screenshots
            </p>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((src, i) => (
                <div key={i} className="relative rounded-[11px] overflow-hidden" style={{ aspectRatio: "1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <footer className="pt-2 space-y-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white transition-all active:scale-95"
            style={{
              background: RED,
              fontFamily: "Raleway, sans-serif",
              boxShadow: "0 8px 24px rgba(229,57,53,0.2)",
            }}
          >
            {loading ? "Submitting…" : "Submit Dispute"}
          </button>
          <div className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            <p className="text-[11px] text-center" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              Our team reviews disputes within 24–48 hours
            </p>
          </div>
        </footer>
      </main>

      <div className="h-10" />
    </div>
  );
}
