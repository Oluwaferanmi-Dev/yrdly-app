"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useRouter } from "next/navigation";

const GREEN = "#388E3C";
const FONT = "Raleway, sans-serif";

/**
 * A compact location chip that shows the user's active location filter.
 * Tapping it toggles between LGA (tight) and State (broad) scope.
 * Long-pressing or clicking the arrow navigates to settings to change location.
 */
export function LocationChip() {
  const { displayLabel, scope, toggleScope, hasLocation } = useLocation();
  const router = useRouter();

  if (!hasLocation) {
    return (
      <button
        onClick={() => router.push("/onboarding/profile")}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
        style={{
          background: "rgba(56,142,60,0.15)",
          color: GREEN,
          border: `0.5px solid ${GREEN}`,
          fontFamily: FONT,
        }}
      >
        <MapPin className="w-3.5 h-3.5" />
        Set Location
      </button>
    );
  }

  return (
    <button
      onClick={toggleScope}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
      style={{
        background: scope === "lga" ? "rgba(56,142,60,0.15)" : "rgba(56,142,60,0.08)",
        color: scope === "lga" ? GREEN : "#82DB7E",
        border: `0.5px solid ${scope === "lga" ? GREEN : "rgba(56,142,60,0.4)"}`,
        fontFamily: FONT,
      }}
    >
      <MapPin className="w-3.5 h-3.5" />
      <span className="max-w-[160px] truncate">{displayLabel}</span>
      <ChevronDown
        className="w-3 h-3 transition-transform"
        style={{ transform: scope === "state" ? "rotate(180deg)" : "none" }}
      />
    </button>
  );
}
