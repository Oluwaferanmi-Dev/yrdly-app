"use client";

import React, { useState } from "react";
import { X, Lock, Info, ChevronRight } from "lucide-react";
import { DeliveryOption, DeliveryDetails, PaymentMethod } from "@/types/escrow";
import { EscrowService } from "@/lib/escrow-service";
import { FlutterwaveService } from "@/lib/flutterwave-service";
import { ItemTrackingService } from "@/lib/item-tracking-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useRouter } from "next/navigation";

/* ── Design tokens ─────────────────────────────────── */
const BG     = "#101418";
const CARD   = "#1d2025";
const CARDH  = "#272a2f";
const GREEN  = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";

interface BuyButtonProps {
  itemId: string;
  itemTitle: string;
  itemImageUrl?: string;
  price: number;
  condition?: string;
  sellerId: string;
  sellerName: string;
}

export function BuyButton({
  itemId,
  itemTitle,
  itemImageUrl,
  price,
  condition = "Used",
  sellerId,
  sellerName,
}: BuyButtonProps) {
  const { user }  = useAuth();
  const { toast } = useToast();
  const router    = useRouter();

  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const commission = Math.round(price * 0.03); // 3%
  const totalPay   = price + commission;

  const handleBuy = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please log in to purchase items.", variant: "destructive" });
      return;
    }
    if (user.id === sellerId) {
      toast({ title: "Not allowed", description: "You cannot buy your own item.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const isAvailable = await ItemTrackingService.isItemAvailable(itemId);
      if (!isAvailable) {
        toast({ title: "Item Sold", description: "This item has already been sold.", variant: "destructive" });
        setOpen(false);
        return;
      }

      const deliveryDetails: DeliveryDetails = { option: DeliveryOption.FACE_TO_FACE };

      const transactionId = await EscrowService.createTransaction(
        itemId,
        user.id,
        sellerId,
        price,
        PaymentMethod.CARD,
        deliveryDetails
      );

      const paymentLink = await FlutterwaveService.initializePayment({
        transactionId,
        amount: totalPay,
        buyerEmail: user.email || "",
        buyerName:
          user.user_metadata?.name || user.email?.split("@")[0] || "Buyer",
        itemTitle,
        sellerName,
      });

      // Navigate to loading screen then redirect
      setOpen(false);
      router.push(
        `/payment/redirect?link=${encodeURIComponent(paymentLink)}&txn=${transactionId}`
      );
    } catch {
      toast({ title: "Error", description: "Failed to create transaction. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-full font-bold transition-all active:scale-95"
        style={{
          background: GREEN,
          color: "#fff",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          boxShadow: "0 8px 24px rgba(56,142,60,0.25)",
        }}
      >
        Buy Now — ₦{price.toLocaleString()}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Sheet */}
          <div
            className="relative w-full max-w-md flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: BG, maxHeight: "92dvh" }}
          >
            {/* Handle */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full md:hidden"
              style={{ background: "rgba(225,226,233,0.1)" }}
            />

            {/* Header */}
            <div
              className="flex items-center px-6 h-16 flex-shrink-0"
              style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
            >
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-70 mr-4"
              >
                <X className="w-5 h-5" style={{ color: GREEN_L }} />
              </button>
              <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
                Order Summary
              </h1>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10">

              {/* Item card */}
              <section
                className="rounded-[11px] p-4 flex gap-4 mb-6 transition-all"
                style={{ background: CARDH }}
              >
                {itemImageUrl && (
                  <div className="w-14 h-14 flex-shrink-0 rounded-[8px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={itemImageUrl}
                      alt={itemTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <h2
                    className="font-bold text-[14px] leading-tight text-white line-clamp-2"
                    style={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    {itemTitle}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: CARD, color: MUTED, fontFamily: "Raleway, sans-serif" }}
                    >
                      {condition}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
                    >
                      Sold by {sellerName}
                    </span>
                  </div>
                </div>
              </section>

              {/* Price breakdown */}
              <section
                className="rounded-[11px] p-4 mb-6 flex flex-col gap-3"
                style={{ background: CARD }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[13px]" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
                    Item Price
                  </span>
                  <span className="text-[14px]" style={{ fontFamily: "Raleway, sans-serif" }}>
                    ₦{price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px]" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
                      Yrdly Escrow Fee
                    </span>
                    <Info className="w-3.5 h-3.5" style={{ color: "rgba(191,202,185,0.5)" }} />
                  </div>
                  <span className="text-[14px]" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
                    ₦{commission.toLocaleString()}
                  </span>
                </div>
                <div className="h-px w-full my-1" style={{ background: "rgba(225,226,233,0.06)" }} />
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-[15px] text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
                    You Pay
                  </span>
                  <span className="font-bold text-[18px] text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
                    ₦{totalPay.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] leading-normal" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
                  Funds are held securely until you confirm receipt
                </p>
              </section>

              {/* Escrow explainer */}
              <section
                className="rounded-[11px] p-4 mb-8 flex gap-3 border"
                style={{
                  background: "rgba(53,166,26,0.07)",
                  borderColor: "rgba(110,223,81,0.2)",
                }}
              >
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#6edf51" }} />
                <div>
                  <h3
                    className="font-bold text-[13px] text-white mb-0.5"
                    style={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    Your payment is held in escrow
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
                    Release funds only after you confirm the item is in good condition.
                  </p>
                </div>
              </section>

              {/* Payment method */}
              <div className="mb-10">
                <p
                  className="text-[12px] font-medium mb-3 px-1"
                  style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}
                >
                  Pay with
                </p>
                <div
                  className="rounded-[11px] p-4 flex items-center justify-between border"
                  style={{ background: CARDH, borderColor: GREEN }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-md"
                      style={{ background: "#fff" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#00315f">
                        <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                    </div>
                    <span className="text-[14px]" style={{ fontFamily: "Raleway, sans-serif" }}>
                      Debit/Credit Card
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: GREEN_L }} />
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full h-14 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: GREEN,
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                    boxShadow: "0 8px 24px rgba(56,142,60,0.3)",
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₦{totalPay.toLocaleString()} Securely
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Lock className="w-3.5 h-3.5" style={{ color: DIM }} />
                  <span className="text-[11px]" style={{ color: DIM, fontFamily: "Raleway, sans-serif" }}>
                    256-bit SSL secured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
