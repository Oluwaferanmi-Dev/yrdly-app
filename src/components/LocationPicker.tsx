"use client";

import { useState, useRef, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';

interface LocationPickerProps {
    onLocationSelect: (location: { address: string; latitude: number; longitude: number; }) => void;
    initialLocation?: { latitude: number; longitude: number; };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [markerPosition, setMarkerPosition] = useState(initialLocation || { lat: 6.5244, lng: 3.3792 }); // Default to Lagos
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry?.location) {
                    setSelectedPlace(place);
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setMarkerPosition({ lat, lng });
                    setAddress(place.formatted_address || '');
                    onLocationSelect({ address: place.formatted_address || '', latitude: lat, longitude: lng });
                }
            });
        }
    }, [onLocationSelect]);

    const handleMapClick = async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            setLoading(true);
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarkerPosition({ lat, lng });

            // Reverse geocode to get the address
            const geocoder = new google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response.results[0]) {
                    const formattedAddress = response.results[0].formatted_address;
                    setAddress(formattedAddress);
                    onLocationSelect({ address: formattedAddress, latitude: lat, longitude: lng });
                }
            } catch (error) {
                console.error("Error reverse geocoding:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
            <div className="space-y-4">
                <Input ref={inputRef} placeholder="Search for a location" />
                <div className="h-64 w-full rounded-md overflow-hidden relative">
                    <Map
                        defaultCenter={markerPosition}
                        center={markerPosition}
                        defaultZoom={12}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        onClick={handleMapClick}
                    >
                        <AdvancedMarker position={markerPosition} />
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
