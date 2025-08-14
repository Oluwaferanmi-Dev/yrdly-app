
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Business, Post } from '@/types';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type MarkerData = {
    id: string;
    type: 'event' | 'business';
    position: { lat: number; lng: number; };
    title: string;
    address: string;
};

export default function MapPage() {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const fetchedMarkers: MarkerData[] = [];

            // Fetch events with locations
            const eventsQuery = query(collection(db, 'posts'), where('category', '==', 'Event'), where('eventLocation', '!=', null));
            const eventsSnapshot = await getDocs(eventsQuery);
            eventsSnapshot.forEach(doc => {
                const post = doc.data() as Post;
                if (post.eventLocation) {
                    fetchedMarkers.push({
                        id: doc.id,
                        type: 'event',
                        position: { lat: post.eventLocation.latitude, lng: post.eventLocation.longitude },
                        title: post.title || post.text,
                        address: post.eventLocation.address,
                    });
                }
            });

            // Fetch businesses
            const businessesQuery = query(collection(db, 'businesses'));
            const businessesSnapshot = await getDocs(businessesQuery);
            businessesSnapshot.forEach(doc => {
                const business = doc.data() as Business;
                fetchedMarkers.push({
                    id: doc.id,
                    type: 'business',
                    position: { lat: business.location.latitude, lng: business.location.longitude },
                    title: business.name,
                    address: business.location.address,
                });
            });

            setMarkers(fetchedMarkers);
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleMarkerClick = (marker: MarkerData) => {
        setSelectedMarker(marker);
    };
    
    const handleInfoWindowClose = () => {
        setSelectedMarker(null);
    };

    const handleViewDetails = (marker: MarkerData) => {
        if (marker.type === 'event') {
            router.push(`/posts/${marker.id}`);
        } else {
            // You might want to create a dedicated page for business details later
            router.push(`/businesses`);
        }
    };

    return (
        <div className="h-[calc(100vh-128px)] w-full relative">
            {loading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
                <Map
                    defaultCenter={{ lat: 6.5244, lng: 3.3792 }} // Default to Lagos
                    defaultZoom={10}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId="YARDLY_MAP_ID"
                >
                    {markers.map(marker => (
                        <Marker key={marker.id} position={marker.position} onClick={() => handleMarkerClick(marker)} />
                    ))}

                    {selectedMarker && (
                        <InfoWindow position={selectedMarker.position} onCloseClick={handleInfoWindowClose}>
                            <Card className="border-none shadow-none">
                                <CardHeader className="p-2">
                                    <CardTitle className="text-base">{selectedMarker.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <p className="text-sm text-muted-foreground">{selectedMarker.address}</p>
                                    <Button size="sm" className="mt-2 w-full" onClick={() => handleViewDetails(selectedMarker)}>
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>
        </div>
    );
}
