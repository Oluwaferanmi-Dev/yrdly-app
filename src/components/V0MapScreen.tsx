"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  Users,
  Filter,
  Search,
  Navigation
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Business, Post } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [filterType, setFilterType] = useState<'all' | 'events' | 'businesses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
          if (post.event_location?.geopoint) {
            fetchedMarkers.push({
              id: post.id,
              type: 'event',
              position: { 
                lat: post.event_location.geopoint.latitude, 
                lng: post.event_location.geopoint.longitude 
              },
              title: post.title || post.text,
              address: post.event_location.address,
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
      router.push(`/businesses`);
    }
  };

  const filteredMarkers = markers.filter(marker => {
    const matchesType = filterType === 'all' || 
      (filterType === 'events' && marker.type === 'event') ||
      (filterType === 'businesses' && marker.type === 'business');
    const matchesSearch = searchQuery === '' || 
      marker.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      marker.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className={`h-screen w-full relative ${className}`}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
        <Card className="yrdly-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border focus:border-primary"
                />
              </div>

              {/* Filter */}
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="events">Events Only</SelectItem>
                  <SelectItem value="businesses">Businesses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="yrdly-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>{markers.filter(m => m.type === 'event').length} Events</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>{markers.filter(m => m.type === 'business').length} Businesses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading map...</p>
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
        >
          {filteredMarkers.map(marker => (
            <AdvancedMarker 
              key={marker.id} 
              position={marker.position} 
              onClick={() => handleMarkerClick(marker)}
            >
              <Pin 
                background={marker.type === 'business' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                borderColor={'hsl(var(--background))'}
                glyphColor={'hsl(var(--primary-foreground))'}
              />
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow position={selectedMarker.position} onCloseClick={handleInfoWindowClose}>
              <Card className="border-none shadow-lg yrdly-shadow max-w-xs">
                <CardHeader className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMarker.type === 'event' ? (
                      <Calendar className="w-4 h-4 text-red-500" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-blue-500" />
                    )}
                    <Badge variant={selectedMarker.type === 'event' ? 'destructive' : 'default'}>
                      {selectedMarker.type === 'event' ? 'Event' : 'Business'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{selectedMarker.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{selectedMarker.address}</span>
                  </div>
                  
                  {selectedMarker.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedMarker.description}
                    </p>
                  )}

                  {selectedMarker.type === 'event' && selectedMarker.date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{selectedMarker.date} {selectedMarker.time && `at ${selectedMarker.time}`}</span>
                    </div>
                  )}

                  {selectedMarker.type === 'event' && selectedMarker.attendees && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{selectedMarker.attendees} attending</span>
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleViewDetails(selectedMarker)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
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
