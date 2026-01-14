import { AuthUser } from './auth-service';

export interface LocationScope {
  state: string | null;
  lga?: string | null;
  ward?: string | null;
}

/**
 * Service for managing location-based content scoping
 * Handles state extraction, filter building, and location matching
 */
export class LocationScopeService {
  /**
   * Get the current user's state from their profile
   */
  static getUserState(profile: AuthUser | null): string | null {
    if (!profile?.location) {
      return null;
    }
    return profile.location.state || null;
  }

  /**
   * Get the current user's LGA from their profile
   */
  static getUserLga(profile: AuthUser | null): string | null {
    if (!profile?.location) {
      return null;
    }
    return profile.location.lga || null;
  }

  /**
   * Get the current user's ward from their profile
   */
  static getUserWard(profile: AuthUser | null): string | null {
    if (!profile?.location) {
      return null;
    }
    return profile.location.ward || null;
  }

  /**
   * Get the default location scope (user's location)
   */
  static getDefaultScope(profile: AuthUser | null): LocationScope {
    return {
      state: this.getUserState(profile),
      lga: this.getUserLga(profile),
      ward: this.getUserWard(profile),
    };
  }

  /**
   * Build a Supabase query filter for location-based filtering
   * Returns filter that includes:
   * - Content matching the specified state
   * - Grandfathered content (state IS NULL)
   * 
   * @param state - State to filter by (required)
   * @param lga - Optional LGA filter
   * @param ward - Optional ward filter
   * @returns Supabase query filter
   */
  static buildLocationFilter(state?: string | null, lga?: string | null, ward?: string | null): any {
    if (!state) {
      // If no state specified, only show grandfathered content
      return { state: null };
    }

    const filters: any[] = [
      { state },
      { state: null }, // Include grandfathered content
    ];

    // Note: Supabase doesn't support complex OR with AND conditions easily
    // We'll handle LGA/ward filtering in the application layer if needed
    // For now, state-level filtering is the primary requirement

    return filters;
  }

  /**
   * Build a Supabase .or() filter string for location-based queries
   * This is used with .or() method: .or(`state.eq.${state},state.is.null`)
   */
  static buildLocationOrFilter(state: string | null): string {
    if (!state) {
      return 'state.is.null';
    }
    return `state.eq.${state},state.is.null`;
  }

  /**
   * Check if content should be included based on location scope
   * 
   * @param contentState - State of the content
   * @param filterState - State being filtered for
   * @returns true if content should be included
   */
  static shouldIncludeContent(contentState: string | null, filterState: string | null): boolean {
    // Grandfathered content (null state) is always visible
    if (contentState === null) {
      return true;
    }

    // If no filter state, only show grandfathered content
    if (filterState === null) {
      return false;
    }

    // Match if states are equal
    return contentState === filterState;
  }

  /**
   * Extract state from event location JSONB
   * Attempts to extract state from address string or returns null
   */
  static extractStateFromEventLocation(eventLocation: any): string | null {
    if (!eventLocation) {
      return null;
    }

    // If address contains state information, try to extract it
    // This is a fallback - ideally state should be set explicitly
    const address = eventLocation.address || '';
    
    // Simple extraction: look for common Nigerian state names in address
    // This is a basic implementation - can be enhanced with proper geocoding
    const nigerianStates = [
      'Lagos', 'Federal Capital Territory', 'Kano', 'Rivers', 'Kaduna', 'Ogun', 'Oyo', 'Edo',
      'Delta', 'Kwara', 'Osun', 'Enugu', 'Plateau', 'Akwa Ibom', 'Ondo',
      'Imo', 'Abia', 'Bauchi', 'Benue', 'Borno', 'Cross River', 'Ebonyi',
      'Ekiti', 'Gombe', 'Jigawa', 'Katsina', 'Kebbi', 'Kogi', 'Nassarawa',
      'Niger', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Bayelsa', 'Anambra'
    ];

    for (const state of nigerianStates) {
      // Use word boundary to avoid partial matches (e.g., "Kano" matching "Kanon")
      const regex = new RegExp(`\\b${state.toLowerCase()}\\b`, 'i');
      if (regex.test(address)) {
        return state;
      }
    }

    return null;
  }

  /**
   * Extract state from business location JSONB
   * Similar to extractStateFromEventLocation
   */
  static extractStateFromBusinessLocation(location: any): string | null {
    return this.extractStateFromEventLocation(location);
  }
}

