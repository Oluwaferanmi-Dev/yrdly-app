"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Building2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/* ── Design tokens ─────────────────────────────────── */
const BG     = "#101418";
const CARD   = "#1d2025";
const CARDH  = "#272a2f";
const GREEN  = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "084", name: "Enterprise Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "090267", name: "Kuda Microfinance Bank" },
];

interface ExistingAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  isVerified: boolean;
  createdAt: string;
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [bankCode, setBankCode]         = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [existing, setExisting]         = useState<ExistingAccount | null>(null);
  const [showForm, setShowForm]         = useState(false);

  // Fetch existing account on mount
  useEffect(() => {
    async function fetchAccount() {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/seller/setup-account", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const data = await res.json();
        if (data.account) {
          setExisting(data.account);
        } else {
          setShowForm(true);
        }
      } catch (err) {
        console.error("Failed to fetch account:", err);
        setShowForm(true);
      } finally {
        setFetching(false);
      }
    }
    fetchAccount();
  }, [user]);

  const handleSubmit = useCallback(async () => {
    if (!bankCode || !accountNumber || !accountName) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/seller/setup-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ bankCode, accountNumber, accountName }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to link account.", variant: "destructive" });
        return;
      }

      toast({ title: "Account linked! ✅", description: "Your bank account is ready to receive payments." });
      setExisting({ accountName, accountNumber, bankCode, isVerified: true, createdAt: new Date().toISOString() });
      setShowForm(false);
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [bankCode, accountNumber, accountName, toast]);

  const getBankName = (code: string) =>
    NIGERIAN_BANKS.find((b) => b.code === code)?.name || code;

  if (fetching) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GREEN_L }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}>
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN_L }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Payout Settings
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-lg mx-auto space-y-8">
        {/* Info banner */}
        <section
          className="rounded-[11px] p-4 flex gap-3 items-start"
          style={{ background: "rgba(56,142,60,0.1)", border: `1px solid ${GREEN}` }}
        >
          <Building2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GREEN_L }} />
          <div>
            <p className="text-sm font-medium" style={{ fontFamily: "Raleway, sans-serif" }}>
              When you sell an item, the buyer&apos;s payment is split automatically:
            </p>
            <p className="text-xs mt-1" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
              97% goes directly to your bank account, 3% platform fee.
            </p>
          </div>
        </section>

        {/* Existing account display */}
        {existing && !showForm && (
          <section className="rounded-[11px] p-6 space-y-5" style={{ background: CARD }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(110,223,81,0.15)" }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: GREEN_L }} />
              </div>
              <div>
                <p className="font-bold text-white">Bank Account Linked</p>
                <p className="text-xs" style={{ color: DIM }}>
                  Ready to receive payments
                </p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: MUTED }}>Account Name</span>
                <span className="text-sm font-medium text-white">{existing.accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: MUTED }}>Account Number</span>
                <span className="text-sm font-medium text-white">
                  ****{existing.accountNumber.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: MUTED }}>Bank</span>
                <span className="text-sm font-medium text-white">{getBankName(existing.bankCode)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="w-full mt-4 py-3 rounded-full text-sm font-bold transition-all"
              style={{ background: CARDH, color: MUTED, fontFamily: "Raleway, sans-serif" }}
            >
              Update Bank Details
            </button>
          </section>
        )}

        {/* Bank details form */}
        {showForm && (
          <section className="rounded-[11px] p-6 space-y-5" style={{ background: CARD }}>
            <h2 className="font-bold text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
              {existing ? "Update" : "Add"} Bank Account
            </h2>

            {/* Bank selection */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: DIM }}>
                Bank
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full rounded-[11px] p-3 text-sm focus:outline-none"
                style={{ background: CARDH, color: "#e1e2e9", border: "1px solid rgba(64,73,61,0.2)" }}
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account number */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: DIM }}>
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="0123456789"
                maxLength={10}
                className="w-full rounded-[11px] p-3 text-sm focus:outline-none"
                style={{ background: CARDH, color: "#e1e2e9", border: "1px solid rgba(64,73,61,0.2)" }}
              />
            </div>

            {/* Account name */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: DIM }}>
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-[11px] p-3 text-sm focus:outline-none"
                style={{ background: CARDH, color: "#e1e2e9", border: "1px solid rgba(64,73,61,0.2)" }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !bankCode || !accountNumber || !accountName}
              className="w-full py-4 rounded-full font-bold text-sm transition-all active:scale-95"
              style={{
                background: bankCode && accountNumber && accountName && !loading ? GREEN : CARDH,
                color: bankCode && accountNumber && accountName && !loading ? "#fff" : DIM,
                fontFamily: "Raleway, sans-serif",
                cursor: bankCode && accountNumber && accountName && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Linking Account…" : "Link Bank Account"}
            </button>

            {existing && (
              <button
                onClick={() => setShowForm(false)}
                className="w-full text-center text-sm py-2"
                style={{ color: DIM }}
              >
                Cancel
              </button>
            )}
          </section>
        )}

        {/* Security note */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{ background: "rgba(39,42,47,0.3)", border: "1px solid rgba(64,73,61,0.15)" }}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
          <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED, fontFamily: "Raleway, sans-serif" }}>
            Your bank details are encrypted and stored securely
          </p>
        </div>
      </main>
    </div>
  );
}
