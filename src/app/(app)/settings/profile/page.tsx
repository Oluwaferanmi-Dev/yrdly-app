"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nassarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

type Profile = {
  name: string;
  bio: string;
  avatar_url: string;
  location?: { state?: string; lga?: string; ward?: string };
};

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName]             = useState("");
  const [bio, setBio]               = useState("");
  const [avatarUrl, setAvatarUrl]   = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [state, setState]           = useState("");
  const [lga, setLga]               = useState("");
  const [ward, setWard]             = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!authProfile) return;
    const p = authProfile as any;
    setName(p.name || "");
    setBio(p.bio || "");
    setAvatarUrl(p.avatar_url || "");
    setState(p.location?.state || "");
    setLga(p.location?.lga || "");
    setWard(p.location?.ward || "");
  }, [authProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (!uploadErr) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from("users").update({
        name,
        bio,
        avatar_url: finalAvatarUrl,
        location: { state, lga, ward },
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      if (error) throw error;

      window.dispatchEvent(new Event("refresh-profile"));
      toast({ title: "Profile saved!", description: "Your changes have been saved." });
      router.back();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-36" style={{ background: "#15181D", fontFamily: "Work Sans, sans-serif", color: "#e1e2e9" }}>

      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(30,33,38,0.85)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 style={{ fontFamily: "Pacifico, cursive", fontSize: 18, color: "#fff" }}>Edit Profile</h1>
        </div>
        <span style={{ fontFamily: "Jersey 25, sans-serif", fontSize: 20, color: "#259907" }}>Yrdly</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-12">

        {/* ── Avatar ── */}
        <section className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-[#388E3C] opacity-60 animate-spin" style={{ animationDuration: "8s" }} />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4" style={{ borderColor: "#1d2025" }}>
              <Avatar className="w-full h-full">
                <AvatarImage src={avatarPreview || avatarUrl} className="object-cover" />
                <AvatarFallback style={{ background: "#388E3C", color: "#fff", fontSize: 32, fontWeight: 700 }}>
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
              style={{ background: "#82DB7E", transform: "translate(4px, 4px)" }}
            >
              <Camera className="w-4 h-4" style={{ color: "#003207" }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="mt-6 text-sm" style={{ color: "#899485" }}>Change profile photo</p>
        </section>

        {/* ── Block 1: Identity ── */}
        <section className="space-y-6">
          <SectionHeader color="#82DB7E" label="Identity" />
          <div className="space-y-4">
            <Field label="Display Name">
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-full px-6 py-4 text-sm outline-none transition-all"
                style={{ background: "#272a2f", color: "#e1e2e9", border: "none" }}
                onFocus={e => e.target.style.boxShadow = `0 0 0 1px #82DB7E`}
                onBlur={e => e.target.style.boxShadow = "none"}
              />
            </Field>
            <Field label="Bio">
              <div className="relative">
                <textarea
                  value={bio} onChange={e => setBio(e.target.value.slice(0, 150))} rows={3}
                  className="w-full px-6 py-4 text-sm outline-none resize-none transition-all"
                  style={{ background: "#272a2f", color: "#e1e2e9", border: "none", borderRadius: 11 }}
                  onFocus={e => e.target.style.boxShadow = `0 0 0 1px #82DB7E`}
                  onBlur={e => e.target.style.boxShadow = "none"}
                />
                <span className="absolute bottom-3 right-4 text-[10px]" style={{ color: "#899485" }}>{bio.length}/150</span>
              </div>
            </Field>
          </div>
        </section>

        {/* ── Block 2: Location ── */}
        <section className="space-y-6">
          <SectionHeader color="#a5c8ff" label="Location" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="State">
              <select
                value={state} onChange={e => setState(e.target.value)}
                className="w-full rounded-full px-6 py-4 text-sm outline-none appearance-none"
                style={{ background: "#272a2f", color: "#e1e2e9", border: "none" }}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="LGA">
              <input
                type="text" value={lga} onChange={e => setLga(e.target.value)} placeholder="Your LGA"
                className="w-full rounded-full px-6 py-4 text-sm outline-none"
                style={{ background: "#272a2f", color: "#e1e2e9", border: "none" }}
              />
            </Field>
            <Field label="Ward">
              <input
                type="text" value={ward} onChange={e => setWard(e.target.value)} placeholder="Ward"
                className="w-full rounded-full px-6 py-4 text-sm outline-none"
                style={{ background: "#272a2f", color: "#e1e2e9", border: "none" }}
              />
            </Field>
          </div>
        </section>

      </main>

      {/* ── Save bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-6"
        style={{ background: "linear-gradient(to top, #15181D 60%, transparent)" }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 rounded-full flex items-center justify-center gap-3 text-white font-extrabold uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-[0_20px_40px_rgba(56,142,60,0.3)]"
            style={{ background: "#388E3C", fontFamily: "Plus Jakarta Sans, sans-serif", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save Changes"}
            {!saving && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */
function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: color }} />
      <h2 className="font-bold uppercase tracking-widest text-lg" style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: color + "cc" }}>{label}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-tighter ml-4" style={{ color: "#899485" }}>{label}</label>
      {children}
    </div>
  );
}
