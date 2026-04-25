"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";

type LocationScope = "lga" | "state";

interface LocationContextType {
  /** The user's home state from their profile */
  userState: string | null;
  /** The user's home LGA from their profile */
  userLga: string | null;
  /** The user's home ward from their profile */
  userWard: string | null;
  /** Current filter scope: 'lga' (default, tight) or 'state' (expanded) */
  scope: LocationScope;
  /** Set the scope to 'lga' or 'state' */
  setScope: (scope: LocationScope) => void;
  /** Toggle between lga and state scope */
  toggleScope: () => void;
  /** Whether the user has a location set at all */
  hasLocation: boolean;
  /** Display label for the current filter, e.g. "Ikeja, Lagos" or "Lagos State" */
  displayLabel: string;
  /** The state value to filter by (always the user's state) */
  filterState: string | null;
  /** The LGA value to filter by (only when scope is 'lga') */
  filterLga: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const SCOPE_STORAGE_KEY = "yrdly_location_scope";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const userState = (profile?.location as any)?.state || null;
  const userLga = (profile?.location as any)?.lga || null;
  const userWard = (profile?.location as any)?.ward || null;
  const hasLocation = !!userState;

  const [scope, setScopeState] = useState<LocationScope>("lga");

  // Restore persisted scope preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCOPE_STORAGE_KEY);
      if (saved === "lga" || saved === "state") {
        setScopeState(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setScope = useCallback((newScope: LocationScope) => {
    setScopeState(newScope);
    try {
      localStorage.setItem(SCOPE_STORAGE_KEY, newScope);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleScope = useCallback(() => {
    setScope(scope === "lga" ? "state" : "lga");
  }, [scope, setScope]);

  // Build the display label
  let displayLabel = "Set Location";
  if (hasLocation) {
    if (scope === "lga" && userLga) {
      displayLabel = `${userLga}, ${userState}`;
    } else if (userState) {
      displayLabel = `${userState} State`;
    }
  }

  // Build the active filters
  const filterState = hasLocation ? userState : null;
  const filterLga = hasLocation && scope === "lga" ? userLga : null;

  return (
    <LocationContext.Provider
      value={{
        userState,
        userLga,
        userWard,
        scope,
        setScope,
        toggleScope,
        hasLocation,
        displayLabel,
        filterState,
        filterLga,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
