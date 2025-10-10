"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  Users,
  Search,
  Navigation,
  ChevronRight
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Business, Post } from '@/types';
import { Input } from '@/components/ui/input';

interface V0MapScreenProps {
  className?: string;
}

type MarkerData = {
  id: string;
  type: 'event' | 'business';
  position: { lat: number; lng: number; };
  title: string;
  address: string;
  description?: string;
  date?: string;
  time?: string;
  attendees?: number;
};

export function V0MapScreen({ className }: V0MapScreenProps) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyEvents, setNearbyEvents] = useState(0);
  const [nearbyBusinesses, setNearbyBusinesses] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedMarkers: MarkerData[] = [];

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'Event')
        .not('event_location', 'is', null);
      
      if (!eventsError && eventsData) {
        eventsData.forEach(post => {
          // Handle different event_location data structures
          let lat, lng, address;
          
          if (post.event_location?.geopoint) {
            // New structure with geopoint
            lat = post.event_location.geopoint.latitude;
            lng = post.event_location.geopoint.longitude;
            address = post.event_location.address;
          } else if (post.event_location?.latitude && post.event_location?.longitude) {
            // Direct lat/lng structure
            lat = post.event_location.latitude;
            lng = post.event_location.longitude;
            address = post.event_location.address || post.event_location.name;
          } else if (typeof post.event_location === 'string') {
            // String address - we'll skip this for now as we need coordinates
            return;
          }
          
          if (lat && lng) {
            fetchedMarkers.push({
              id: post.id,
              type: 'event',
              position: { lat, lng },
              title: post.title || post.text,
              address: address || 'Location not specified',
              description: post.text,
              date: post.event_date,
              time: post.event_time,
              attendees: post.attendees?.length || 0,
            });
          }
        });
      }

      // Fetch businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .not('location', 'is', null);
      
      if (!businessesError && businessesData) {
        businessesData.forEach(business => {
          if (business.location?.geopoint) {
            fetchedMarkers.push({
              id: business.id,
              type: 'business',
              position: { 
                lat: business.location.geopoint.latitude, 
                lng: business.location.geopoint.longitude 
              },
              title: business.name,
              address: business.location.address,
              description: business.description,
            });
          }
        });
      }
      
      setMarkers(fetchedMarkers);
      setNearbyEvents(fetchedMarkers.filter(m => m.type === 'event').length);
      setNearbyBusinesses(fetchedMarkers.filter(m => m.type === 'business').length);
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
      router.push(`/businesses/${marker.id}`);
    }
  };

  const filteredMarkers = markers.filter(marker => {
    const matchesSearch = searchQuery === '' || 
      marker.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      marker.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={`h-screen w-full relative bg-gray-900 ${className}`}>
      {/* Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map */}
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
        <Map
          defaultCenter={{ lat: 6.5244, lng: 3.3792 }} // Default to Lagos
          defaultZoom={10}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="7bdaf6c131a6958be5380043f"
          className="w-full h-full"
          options={{
            styles: [
              {
                featureType: "all",
                elementType: "geometry",
                stylers: [{ color: "#2d3748" }]
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#1a202c" }]
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#4a5568" }]
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca3af" }]
              },
              {
                featureType: "poi",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#1a202c" }]
              },
              {
                featureType: "administrative",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca3af" }]
              },
              {
                featureType: "administrative",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#1a202c" }]
              }
            ]
          }}
        >
          {filteredMarkers.map(marker => (
            <AdvancedMarker 
              key={marker.id} 
              position={marker.position} 
              onClick={() => handleMarkerClick(marker)}
            >
              <div className="relative">
                <Pin 
                  background={marker.type === 'business' ? '#3b82f6' : '#ef4444'}
                  borderColor={'#1a202c'}
                  glyphColor={'white'}
                />
                {/* Location Labels */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                    {marker.title}
                  </span>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow position={selectedMarker.position} onCloseClick={handleInfoWindowClose}>
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-xs p-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedMarker.type === 'event' ? (
                    <Calendar className="w-4 h-4 text-red-500" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-blue-500" />
                  )}
                  <Badge 
                    variant={selectedMarker.type === 'event' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {selectedMarker.type === 'event' ? 'Event' : 'Business'}
                  </Badge>
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{selectedMarker.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{selectedMarker.address}</span>
                </div>
                
                {selectedMarker.description && (
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                    {selectedMarker.description}
                  </p>
                )}

                {selectedMarker.type === 'event' && selectedMarker.date && (
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedMarker.date} {selectedMarker.time && `at ${selectedMarker.time}`}</span>
                  </div>
                )}

                {selectedMarker.type === 'event' && selectedMarker.attendees && (
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                    <Users className="w-4 h-4" />
                    <span>{selectedMarker.attendees} attending</span>
                  </div>
                )}

                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => handleViewDetails(selectedMarker)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Bottom Information Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="bg-gray-800 border-gray-700 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Events Count */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span className="text-white font-medium">
                    {nearbyEvents} Event{nearbyEvents !== 1 ? 's' : ''} nearby
                  </span>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="text-white font-medium">
                    {nearbyBusinesses} Business{nearbyBusinesses !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
              
              {/* View All Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => router.push('/events')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
