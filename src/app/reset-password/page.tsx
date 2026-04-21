"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

/* ── Design tokens ─────────────────────────────────── */
const BG     = "#101418";
const CARD   = "#1d2025";
const CARDH  = "#272a2f";
const GREEN  = "#388E3C";
const GREEN_L = "#82DB7E";
const MUTED  = "#bfcab9";
const DIM    = "#899485";
const RED    = "#E53935";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow]                   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Listen for Supabase RECOVERY event (user came from reset email link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const passwordValid   = password.length >= 6;
  const passwordsMatch  = password === confirmPassword;
  const canSubmit        = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });

      // Redirect to home after a short delay
      setTimeout(() => router.push("/"), 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto" style={{ color: GREEN_L }} />
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
            Password Updated!
          </h1>
          <p className="text-sm" style={{ color: MUTED }}>
            Redirecting you now…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: BG, color: "#e1e2e9", fontFamily: "Work Sans, sans-serif" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: "rgba(130,219,126,0.05)", filter: "blur(120px)" }}
        />
      </div>

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16"
        style={{ background: "rgba(21,24,29,0.85)", backdropFilter: "blur(20px)" }}
      >
        <button onClick={() => router.push("/signin")} className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: GREEN_L }} />
        </button>
        <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#fff" }}>
          Reset Password
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(56,142,60,0.15)" }}
            >
              <Lock className="w-10 h-10" style={{ color: GREEN_L }} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Raleway, sans-serif" }}>
              Create a new password
            </h2>
            <p className="text-sm mt-2" style={{ color: MUTED }}>
              Your password must be at least 6 characters.
            </p>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: DIM }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[11px] p-3 pr-12 text-sm focus:outline-none transition-all"
                style={{
                  background: CARDH,
                  color: "#e1e2e9",
                  border: `1px solid ${password && !passwordValid ? RED : "rgba(64,73,61,0.2)"}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {show ? (
                  <EyeOff className="w-4 h-4" style={{ color: DIM }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: DIM }} />
                )}
              </button>
            </div>
            {password && !passwordValid && (
              <p className="text-xs" style={{ color: RED }}>
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: DIM }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[11px] p-3 pr-12 text-sm focus:outline-none transition-all"
                style={{
                  background: CARDH,
                  color: "#e1e2e9",
                  border: `1px solid ${confirmPassword && !passwordsMatch ? RED : "rgba(64,73,61,0.2)"}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" style={{ color: DIM }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: DIM }} />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs" style={{ color: RED }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 rounded-full font-bold text-sm transition-all active:scale-95 mt-8"
            style={{
              background: canSubmit ? GREEN : CARDH,
              color: canSubmit ? "#fff" : DIM,
              fontFamily: "Raleway, sans-serif",
              boxShadow: canSubmit ? "0 8px 24px rgba(56,142,60,0.2)" : "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </main>
    </div>
  );
}
