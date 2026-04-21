"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReviewService } from "@/lib/review-service";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";

/* ── Design tokens ─────────────────────────────────── */
const BG     = "#101418";
const CARD   = "#191c21";
const CARDH  = "#272a2f";
const Green  = "#388E3C";
const GreenL = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";

const QUICK_TAGS = [
  "Fast response",
  "Item as described",
  "Great seller",
  "Would recommend",
  "Honest & reliable",
  "Easy transaction",
];

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function ReviewPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const params    = useSearchParams();
  const router    = useRouter();
  const { toast } = useToast();
  const { user }  = useAuth();

  const sellerName = params.get("seller") ?? "Seller";

  const [rating, setRating]     = useState(4);
  const [hover, setHover]       = useState(0);
  const [text, setText]         = useState("");
  const [tags, setTags]         = useState<string[]>(["Fast response"]);
  const [loading, setLoading]   = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Resolve businessId from the transaction's item
  useEffect(() => {
    async function fetchBusinessId() {
      const { data } = await supabase
        .from('escrow_transactions')
        .select('item:posts(business_id)')
        .eq('id', transactionId)
        .single();
      if (data?.item?.[0]?.business_id) {
        setBusinessId(data.item[0].business_id);
      }
    }
    fetchBusinessId();
  }, [transactionId]);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = useCallback(async () => {
    if (!rating || !user) return;
    setLoading(true);
    try {
      const comment = [text, ...tags].filter(Boolean).join(' | ');
      if (businessId) {
        await ReviewService.submitReview(businessId, user.id, transactionId, rating, comment);
      }
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      router.push(`/transactions/${transactionId}`);
    } catch {
      toast({ title: "Error", description: "Could not submit review.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [rating, transactionId, toast, router, user, businessId, text, tags]);

  const display = hover || rating;

  return (
    <div
      className="min-h-dvh"
      style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: "rgba(130,219,126,0.05)", filter: "blur(120px)" }} />
        <div className="absolute bottom-[-5%] left-[-10%] w-[40%] h-[40%] rounded-full" style={{ background: "rgba(165,200,255,0.05)", filter: "blur(100px)" }} />
      </div>

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: Green }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Leave a Review
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-2xl mx-auto flex flex-col gap-10">

        {/* Seller card */}
        <section className="flex items-center gap-5 p-4 rounded-lg" style={{ background: CARD }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: CARDH, color: GreenL, fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {sellerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-lg leading-tight">{sellerName}</h2>
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full self-start"
              style={{ background: "#006ec9", color: "#eaf0ff" }}
            >
              Seller
            </span>
          </div>
        </section>

        {/* Star rating */}
        <section className="flex flex-col items-center gap-4 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <svg viewBox="0 0 24 24" className="w-12 h-12" fill={s <= display ? "#FFD700" : "none"} stroke={s <= display ? "#FFD700" : DIM} strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          <p
            className="text-lg font-semibold"
            style={{ color: GreenL, fontFamily: "Raleway, sans-serif" }}
          >
            {STAR_LABELS[display]}
          </p>
        </section>

        {/* Text area */}
        <section>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 120))}
              placeholder="Share your experience... (optional)"
              rows={5}
              className="w-full rounded-[11px] p-4 text-sm resize-none focus:outline-none transition-all font-light italic"
              style={{
                background: CARDH,
                color: "#e1e2e9",
                fontFamily: "Raleway, sans-serif",
                border: "1px solid rgba(64,73,61,0.2)",
              }}
              onFocus={(e) => (e.target.style.borderColor = Green)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(64,73,61,0.2)")}
            />
            <div
              className="absolute bottom-3 right-4 text-[11px]"
              style={{ color: DIM }}
            >
              {text.length} / 120
            </div>
          </div>
        </section>

        {/* Quick feedback tags */}
        <section className="flex flex-col gap-4">
          <h3
            className="text-xs uppercase tracking-[0.2em] font-bold"
            style={{ color: DIM }}
          >
            Quick Feedback
          </h3>
          <div className="flex flex-wrap gap-3">
            {QUICK_TAGS.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    fontFamily: "Raleway, sans-serif",
                    background: active ? "rgba(6,23,27,1)" : CARD,
                    border: `1px solid ${active ? Green : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#BBF7D0" : MUTED,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col items-center gap-6 mt-2">
          <button
            onClick={handleSubmit}
            disabled={!rating || loading}
            className="w-full py-4 rounded-full font-bold text-lg transition-all active:scale-95"
            style={{
              background: Green,
              color: "#fff",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            {loading ? "Submitting…" : "Submit Review"}
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm py-2 px-6 hover:text-white transition-colors"
            style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}
          >
            Skip for now
          </button>
        </section>
      </main>
    </div>
  );
}
