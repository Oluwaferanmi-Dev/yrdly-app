'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLocationData } from '@/hooks/use-location-data';
import { MapPin, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationFilterProps {
  state?: string | null;
  lga?: string | null;
  ward?: string | null;
  onFilterChange: (state?: string | null, lga?: string | null, ward?: string | null) => void;
  showReset?: boolean;
  className?: string;
  showIndicator?: boolean;
}

/**
 * Reusable location filter component
 * Allows users to filter content by state, LGA, and ward
 */
export function LocationFilter({
  state,
  lga,
  ward,
  onFilterChange,
  showReset = true,
  className,
  showIndicator = true,
}: LocationFilterProps) {
  const { states, lgas, wards, loadLgas, loadWards } = useLocationData();
  const [selectedState, setSelectedState] = useState<string>(state || '');
  const [selectedLga, setSelectedLga] = useState<string>(lga || '');
  const [selectedWard, setSelectedWard] = useState<string>(ward || '');

  // Sync internal state with props
  useEffect(() => {
    setSelectedState(state || '');
    setSelectedLga(lga || '');
    setSelectedWard(ward || '');
  }, [state, lga, ward]);

  // Load LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      loadLgas(selectedState);
      // Reset LGA and ward when state changes
      if (selectedState !== state) {
        setSelectedLga('');
        setSelectedWard('');
      }
    }
  }, [selectedState, loadLgas, state]);

  // Load wards when LGA changes. 
  useEffect(() => {
    if (selectedState && selectedLga) {
      loadWards(selectedState, selectedLga);
      // Reset ward when LGA changes
      if (selectedLga !== lga) {
        setSelectedWard('');
      }
    }
  }, [selectedState, selectedLga, loadWards, lga]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedLga('');
    setSelectedWard('');
    onFilterChange(newState || null, null, null);
  };

  const ALL_LGAS_VALUE = '__all_lgas';
  const ALL_WARDS_VALUE = '__all_wards';

  const handleLgaChange = (newLga: string) => {
    const value = newLga === ALL_LGAS_VALUE ? '' : newLga;
    setSelectedLga(value);
    setSelectedWard('');
    onFilterChange(selectedState || null, value || null, null);
  };

  const handleWardChange = (newWard: string) => {
    const value = newWard === ALL_WARDS_VALUE ? '' : newWard;
    setSelectedWard(value);
    onFilterChange(selectedState || null, selectedLga || null, value || null);
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedLga('');
    setSelectedWard('');
    onFilterChange(null, null, null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {showIndicator && state && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Showing results in {state}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm font-medium mb-1 block">State</label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.filter((s) => s != null && s !== '').map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedState && lgas.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">LGA (Optional)</label>
            <Select value={selectedLga || ALL_LGAS_VALUE} onValueChange={handleLgaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select LGA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LGAS_VALUE}>All LGAs</SelectItem>
                {lgas.filter((l) => l != null && l !== '').map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedState && selectedLga && wards.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">Ward (Optional)</label>
            <Select value={selectedWard || ALL_WARDS_VALUE} onValueChange={handleWardChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_WARDS_VALUE}>All Wards</SelectItem>
                {wards.filter((w) => w != null && w !== '').map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showReset && (selectedState || selectedLga || selectedWard) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

