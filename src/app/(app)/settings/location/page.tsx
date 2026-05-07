"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useLocationData } from "@/hooks/use-location-data";
import { useLocation } from "@/contexts/LocationContext";
import { ArrowLeft, MapPin, Check } from "lucide-react";

const FONT = "Raleway, sans-serif";
const PACIFICO = "Pacifico, cursive";
const GREEN = "#388E3C";
const CARD = "#1E2126";
const BG = "#15181D";

export default function LocationSettingsPage() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { displayLabel } = useLocation();
  const {
    states,
    lgas,
    wards,
    isLoading: locationLoading,
    loadLgas,
    loadWards,
  } = useLocationData();

  const profileLocation = profile?.location as
    | { state?: string; lga?: string; ward?: string }
    | undefined;

  const [selectedState, setSelectedState] = useState(
    profileLocation?.state || ""
  );
  const [selectedLga, setSelectedLga] = useState(profileLocation?.lga || "");
  const [selectedWard, setSelectedWard] = useState(
    profileLocation?.ward || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load LGAs when state is set on mount
  useEffect(() => {
    if (selectedState) loadLgas(selectedState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load wards when LGA is set on mount
  useEffect(() => {
    if (selectedState && selectedLga) loadWards(selectedState, selectedLga);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedLga("");
    setSelectedWard("");
    loadLgas(state);
    setSaved(false);
  };

  const handleLgaChange = (lga: string) => {
    setSelectedLga(lga);
    setSelectedWard("");
    loadWards(selectedState, lga);
    setSaved(false);
  };

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    setSaved(false);
  };

  const hasChanges =
    selectedState !== (profileLocation?.state || "") ||
    selectedLga !== (profileLocation?.lga || "") ||
    selectedWard !== (profileLocation?.ward || "");

  const canSave = selectedState && selectedLga && hasChanges;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateProfile({
        location: {
          state: selectedState,
          lga: selectedLga,
          ward: selectedWard || undefined,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating location:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: BG }}>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: CARD }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1
            className="text-white text-[20px]"
            style={{ fontFamily: PACIFICO }}
          >
            Location
          </h1>
        </div>

        {/* Current location display */}
        <div
          className="p-4 rounded-[11px] flex items-center gap-3"
          style={{ background: CARD }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(56,142,60,0.15)" }}
          >
            <MapPin className="w-5 h-5" style={{ color: GREEN }} />
          </div>
          <div className="flex-1">
            <p
              className="text-[11px] uppercase tracking-wider"
              style={{ fontFamily: FONT, color: "#888" }}
            >
              Current Location
            </p>
            <p
              className="text-white text-[14px] font-semibold"
              style={{ fontFamily: FONT }}
            >
              {displayLabel}
            </p>
          </div>
        </div>

        {/* Info */}
        <p
          className="text-[12px] px-1"
          style={{ fontFamily: FONT, color: "#999", lineHeight: 1.6 }}
        >
          Your location determines which posts, events, marketplace items, and
          neighbors you see. Change it if you&apos;ve moved to a new area.
        </p>

        {/* State selector */}
        <div className="space-y-2">
          <label
            className="text-[12px] uppercase tracking-wider px-1"
            style={{ fontFamily: FONT, color: "#888" }}
          >
            State *
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={locationLoading}
            className="w-full p-4 rounded-[11px] text-white text-[14px] appearance-none outline-none"
            style={{
              background: CARD,
              fontFamily: FONT,
              border: selectedState ? `1px solid ${GREEN}` : "1px solid #333",
            }}
          >
            <option value="">Select your state</option>
            {states
              .filter((s) => s != null && s !== "")
              .map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
          </select>
        </div>

        {/* LGA selector */}
        <div className="space-y-2">
          <label
            className="text-[12px] uppercase tracking-wider px-1"
            style={{ fontFamily: FONT, color: "#888" }}
          >
            Local Government Area *
          </label>
          <select
            value={selectedLga}
            onChange={(e) => handleLgaChange(e.target.value)}
            disabled={!selectedState || locationLoading}
            className="w-full p-4 rounded-[11px] text-white text-[14px] appearance-none outline-none"
            style={{
              background: CARD,
              fontFamily: FONT,
              border: selectedLga ? `1px solid ${GREEN}` : "1px solid #333",
              opacity: !selectedState ? 0.5 : 1,
            }}
          >
            <option value="">
              {!selectedState ? "Select state first" : "Select your LGA"}
            </option>
            {lgas
              .filter((l) => l != null && l !== "")
              .map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
          </select>
        </div>

        {/* Ward selector */}
        <div className="space-y-2">
          <label
            className="text-[12px] uppercase tracking-wider px-1"
            style={{ fontFamily: FONT, color: "#888" }}
          >
            Ward (Optional)
          </label>
          <select
            value={selectedWard}
            onChange={(e) => handleWardChange(e.target.value)}
            disabled={!selectedLga || locationLoading}
            className="w-full p-4 rounded-[11px] text-white text-[14px] appearance-none outline-none"
            style={{
              background: CARD,
              fontFamily: FONT,
              border: selectedWard ? `1px solid ${GREEN}` : "1px solid #333",
              opacity: !selectedLga ? 0.5 : 1,
            }}
          >
            <option value="">
              {!selectedLga ? "Select LGA first" : "Select your ward"}
            </option>
            {wards
              .filter((w) => w != null && w !== "")
              .map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
          </select>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 rounded-full text-[14px] font-bold transition-all active:scale-[0.98]"
          style={{
            fontFamily: FONT,
            background: canSave ? GREEN : "#333",
            color: canSave ? "#fff" : "#666",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Location Updated!
            </span>
          ) : (
            "Save Location"
          )}
        </button>
      </div>
    </div>
  );
}
