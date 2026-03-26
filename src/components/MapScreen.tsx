"use client";

import { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  Users,
  Search,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-supabase-auth';

const BG    = "#101418";
const CARD  = "#1E2126";
const GREEN = "#388E3C";
const GREEN_LIGHT = "#82DB7E";
const FONT  = "Work Sans, sans-serif";
const HEADLINE = "Raleway, sans-serif";

interface MapScreenProps {
  className?: string;
}

type MarkerData = {
  id: string;
  type: 'event' | 'business' | 'friend';
  position: { lat: number; lng: number };
  title: string;
  address: string;
  description?: string;
  date?: string;
  time?: string;
  attendees?: number;
  avatar_url?: string;
  last_seen?: string;
};

export function MapScreen({ className }: MapScreenProps) {
  const { user } = useAuth();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyEvents, setNearbyEvents] = useState(0);
  const [nearbyBusinesses, setNearbyBusinesses] = useState(0);
  const [nearbyFriends, setNearbyFriends] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedMarkers: MarkerData[] = [];

      const extractLatLng = (loc: any): { lat: number; lng: number; address: string } | null => {
        if (!loc) return null;
        if (loc.geopoint)               return { lat: loc.geopoint.latitude, lng: loc.geopoint.longitude, address: loc.address };
        if (loc.latitude && loc.longitude) return { lat: loc.latitude,          lng: loc.longitude,          address: loc.address };
        if (loc.lat && loc.lng)         return { lat: loc.lat,                 lng: loc.lng,                address: loc.address };
        return null;
      };

      const { data: eventsData } = await supabase.from('posts').select('*').eq('category', 'Event').not('event_location', 'is', null);
      (eventsData || []).forEach(post => {
        const coords = extractLatLng(typeof post.event_location === 'string' ? null : post.event_location);
        if (coords) fetchedMarkers.push({ id: post.id, type: 'event', position: coords, title: post.title || post.text, address: coords.address || 'Location not specified', description: post.text, date: post.event_date, time: post.event_time, attendees: post.attendees?.length || 0 });
      });

      const { data: bizData } = await supabase.from('businesses').select('*').not('location', 'is', null);
      (bizData || []).forEach(biz => {
        const coords = extractLatLng(biz.location);
        if (coords) fetchedMarkers.push({ id: biz.id, type: 'business', position: coords, title: biz.name, address: coords.address || 'Location not specified', description: biz.description });
      });

      if (user?.id) {
        const { data: friendsData } = await supabase.rpc('get_friends_locations', { user_id: user.id });
        (friendsData || []).forEach((friend: any) => {
          const coords = extractLatLng(friend.location);
          if (coords) fetchedMarkers.push({ id: friend.friend_id, type: 'friend', position: coords, title: friend.friend_name, address: coords.address || 'Location not specified', avatar_url: friend.friend_avatar_url, last_seen: friend.last_seen });
        });
      }

      setMarkers(fetchedMarkers);
      setNearbyEvents(fetchedMarkers.filter(m => m.type === 'event').length);
      setNearbyBusinesses(fetchedMarkers.filter(m => m.type === 'business').length);
      setNearbyFriends(fetchedMarkers.filter(m => m.type === 'friend').length);
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  const filteredMarkers = markers.filter(m =>
    searchQuery === '' ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (marker: MarkerData) => {
    if (marker.type === 'event')    router.push(`/posts/${marker.id}`);
    else if (marker.type === 'business') router.push(`/businesses/${marker.id}`);
    else                            router.push(`/profile/${marker.id}`);
  };

  const markerColor = (type: MarkerData['type']) =>
    type === 'business' ? '#3b82f6' : type === 'event' ? '#ef4444' : GREEN;

  return (
    <div className={`h-screen w-full relative ${className}`} style={{ background: BG }}>
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GREEN_LIGHT }} />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-full pl-11 pr-4 text-sm text-white outline-none"
            style={{ background: CARD, border: `1px solid ${GREEN}`, fontFamily: FONT }}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(16,20,24,0.85)" }}>
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto" style={{ borderColor: GREEN, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: GREEN_LIGHT, fontFamily: FONT }}>Loading map...</p>
          </div>
        </div>
      )}

      {/* Map */}
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
        <Map
          defaultCenter={{ lat: 6.5244, lng: 3.3792 }}
          defaultZoom={10}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="7bdaf6c131a6958be5380043f"
          className="w-full h-full"
          styles={[
            { featureType: "all",            elementType: "geometry",         stylers: [{ color: "#1d2025" }] },
            { featureType: "water",           elementType: "geometry",         stylers: [{ color: "#101418" }] },
            { featureType: "road",            elementType: "geometry",         stylers: [{ color: "#272a2f" }] },
            { featureType: "poi",             elementType: "labels.text.fill", stylers: [{ color: "#899485" }] },
            { featureType: "poi",             elementType: "labels.text.stroke",stylers: [{ color: "#101418" }] },
            { featureType: "administrative",  elementType: "labels.text.fill", stylers: [{ color: "#899485" }] },
            { featureType: "administrative",  elementType: "labels.text.stroke",stylers: [{ color: "#101418" }] },
          ]}
        >
          {filteredMarkers.map(marker => (
            <AdvancedMarker key={marker.id} position={marker.position} onClick={() => setSelectedMarker(marker)}>
              <div className="relative">
                <Pin background={markerColor(marker.type)} borderColor="#101418" glyphColor="white" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-white text-xs font-medium px-2 py-0.5 rounded" style={{ background: "rgba(16,20,24,0.8)" }}>
                    {marker.title}
                  </span>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow position={selectedMarker.position} onCloseClick={() => setSelectedMarker(null)}>
              <div className="rounded-xl shadow-2xl max-w-xs p-4" style={{ background: CARD, border: `1px solid rgba(56,142,60,0.3)` }}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedMarker.type === 'event' ? (
                    <Calendar className="w-4 h-4" style={{ color: "#ef4444" }} />
                  ) : selectedMarker.type === 'business' ? (
                    <Briefcase className="w-4 h-4" style={{ color: "#3b82f6" }} />
                  ) : (
                    <Users className="w-4 h-4" style={{ color: GREEN_LIGHT }} />
                  )}
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: selectedMarker.type === 'event' ? 'rgba(239,68,68,0.15)' : selectedMarker.type === 'business' ? 'rgba(59,130,246,0.15)' : 'rgba(56,142,60,0.15)',
                      color: selectedMarker.type === 'event' ? '#ef4444' : selectedMarker.type === 'business' ? '#3b82f6' : GREEN_LIGHT,
                      fontFamily: FONT,
                    }}
                  >
                    {selectedMarker.type === 'event' ? 'Event' : selectedMarker.type === 'business' ? 'Business' : 'Friend'}
                  </span>
                </div>

                <h3 className="font-bold text-base mb-2 text-white" style={{ fontFamily: HEADLINE }}>{selectedMarker.title}</h3>

                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "#899485", fontFamily: FONT }}>
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedMarker.address}</span>
                </div>

                {selectedMarker.description && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: "#bfcab9", fontFamily: FONT }}>{selectedMarker.description}</p>
                )}
                {selectedMarker.type === 'event' && selectedMarker.date && (
                  <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "#899485", fontFamily: FONT }}>
                    <Clock className="w-4 h-4" />
                    <span>{selectedMarker.date}{selectedMarker.time ? ` at ${selectedMarker.time}` : ''}</span>
                  </div>
                )}
                {selectedMarker.type === 'event' && selectedMarker.attendees !== undefined && (
                  <div className="flex items-center gap-2 text-sm mb-3" style={{ color: "#899485", fontFamily: FONT }}>
                    <Users className="w-4 h-4" />
                    <span>{selectedMarker.attendees} attending</span>
                  </div>
                )}
                {selectedMarker.type === 'friend' && selectedMarker.last_seen && (
                  <div className="flex items-center gap-2 text-sm mb-3" style={{ color: "#899485", fontFamily: FONT }}>
                    <Clock className="w-4 h-4" />
                    <span>Last seen: {new Date(selectedMarker.last_seen).toLocaleString()}</span>
                  </div>
                )}

                <button
                  onClick={() => handleViewDetails(selectedMarker)}
                  className="w-full h-9 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: GREEN, color: "#fff", fontFamily: HEADLINE }}
                >
                  <Navigation className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Bottom info panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="p-4 rounded-[11px]" style={{ background: CARD, border: `1px solid rgba(56,142,60,0.2)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: "#ef4444" }} />
                <span className="text-white text-sm font-semibold" style={{ fontFamily: FONT }}>
                  {nearbyEvents} Event{nearbyEvents !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-px h-4" style={{ background: "rgba(137,148,133,0.3)" }} />
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" style={{ color: "#3b82f6" }} />
                <span className="text-white text-sm font-semibold" style={{ fontFamily: FONT }}>
                  {nearbyBusinesses} Biz
                </span>
              </div>
              <div className="w-px h-4" style={{ background: "rgba(137,148,133,0.3)" }} />
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: GREEN_LIGHT }} />
                <span className="text-white text-sm font-semibold" style={{ fontFamily: FONT }}>
                  {nearbyFriends} Friend{nearbyFriends !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/events')}
              className="flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ color: GREEN_LIGHT, fontFamily: HEADLINE }}
            >
              All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}