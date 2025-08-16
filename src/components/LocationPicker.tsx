
"use client";

import { useState, useRef, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, MapMouseEvent } from '@vis.gl/react-google-maps';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandGroup, CommandItem } from './ui/command';


interface LocationPickerProps {
    onLocationSelect: (location: { address: string; latitude: number; longitude: number; }) => void;
    initialLocation?: { address: string, latitude: number; longitude: number; } | null;
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [markerPosition, setMarkerPosition] = useState(
        initialLocation 
            ? { lat: initialLocation.latitude, lng: initialLocation.longitude } 
            : { lat: 6.5244, lng: 3.3792 } // Default to Lagos
    );
    const [address, setAddress] = useState(initialLocation?.address || '');
    const [loading, setLoading] = useState(false);
    
    const {
        placesService,
        placePredictions,
        getPlacePredictions,
        isPlacePredictionsLoading,
    } = usePlacesAutocomplete();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (initialLocation) {
            setMarkerPosition({ lat: initialLocation.latitude, lng: initialLocation.longitude });
            setAddress(initialLocation.address);
        }
    }, [initialLocation]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
        if(e.target.value) {
            getPlacePredictions({ input: e.target.value });
            setIsPopoverOpen(true);
        } else {
            setIsPopoverOpen(false);
        }
    };

    const handleSuggestionClick = (placeId: string) => {
        placesService?.getDetails({ placeId, fields: ['geometry.location', 'formatted_address'] }, (placeDetails) => {
            if (placeDetails?.geometry?.location && placeDetails.formatted_address) {
                const lat = placeDetails.geometry.location.lat();
                const lng = placeDetails.geometry.location.lng();
                setMarkerPosition({ lat, lng });
                setAddress(placeDetails.formatted_address);
                onLocationSelect({ address: placeDetails.formatted_address, latitude: lat, longitude: lng });
                setIsPopoverOpen(false);
            }
        });
    };
    
    const handleMapClick = (event: MapMouseEvent) => {
        if (event.detail.latLng) {
            setLoading(true);
            const { lat, lng } = event.detail.latLng;
            setMarkerPosition({ lat, lng });

            if (window.google?.maps) {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } })
                    .then(response => {
                        if (response.results[0]) {
                            const formattedAddress = response.results[0].formatted_address;
                            setAddress(formattedAddress);
                            onLocationSelect({ address: formattedAddress, latitude: lat, longitude: lng });
                        }
                    })
                    .catch(error => {
                        console.error("Error reverse geocoding:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        }
    };

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
            <div className="space-y-4">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                     <PopoverTrigger asChild>
                        <Input 
                            placeholder="Search for a location or click on the map" 
                            onChange={handleInputChange} 
                            value={address}
                            onFocus={() => address && setIsPopoverOpen(true)}
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                         <Command>
                            <CommandGroup>
                                {isPlacePredictionsLoading ? (
                                    <CommandItem>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </CommandItem>
                                ) : (
                                    placePredictions.map(item => (
                                        <CommandItem
                                            key={item.place_id}
                                            onSelect={() => handleSuggestionClick(item.place_id)}
                                            value={item.description}
                                        >
                                            {item.description}
                                        </CommandItem>
                                    ))
                                )}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div className="h-64 w-full rounded-md overflow-hidden relative">
                    <Map
                        defaultCenter={markerPosition}
                        center={markerPosition}
                        defaultZoom={12}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        onClick={handleMapClick}
                        mapId="ec5615b9"
                    >
                        <AdvancedMarker position={markerPosition}>
                             <Pin />
                        </AdvancedMarker>
                    </Map>
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                {address && <p className="text-sm text-muted-foreground">Selected: {address}</p>}
            </div>
        </APIProvider>
    );
}
