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
      'Lagos', 'Abuja', 'Kano', 'Rivers', 'Kaduna', 'Ogun', 'Oyo', 'Edo',
      'Delta', 'Kwara', 'Osun', 'Enugu', 'Plateau', 'Akwa Ibom', 'Ondo',
      'Imo', 'Abia', 'Bauchi', 'Benue', 'Borno', 'Cross River', 'Ebonyi',
      'Ekiti', 'Gombe', 'Jigawa', 'Katsina', 'Kebbi', 'Kogi', 'Nasarawa',
      'Niger', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Bayelsa', 'Anambra'
    ];

    for (const state of nigerianStates) {
      if (address.toLowerCase().includes(state.toLowerCase())) {
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

