"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FriendLocation {
  friend_id: string;
  friend_name: string;
  friend_avatar_url: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
    lastUpdated: string;
  };
  last_seen: string;
}

interface V0FriendsMapScreenProps {
  onBack?: () => void;
}

export function V0FriendsMapScreen({ onBack }: V0FriendsMapScreenProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [friendsLocations, setFriendsLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, lng: longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          
          // Update user's location in database if they have location sharing enabled
          if (profile?.shareLocation) {
            updateUserLocation(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Please enable location access to see friends on the map.",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, [profile?.shareLocation, toast, updateUserLocation]);

  // Fetch friends' locations
  const fetchFriendsLocations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_friends_locations', {
        user_id: user.id
      });

      if (error) {
        console.error('Error fetching friends locations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load friends' locations.",
        });
        return;
      }

      setFriendsLocations(data || []);
    } catch (error) {
      console.error('Error fetching friends locations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Update user's location in database
  const updateUserLocation = useCallback(async (lat: number, lng: number) => {
    if (!user || !profile?.shareLocation) return;

    try {
      // Get address from coordinates (you can use a geocoding service here)
      const address = await getAddressFromCoordinates(lat, lng);
      
      const { error } = await supabase.rpc('update_user_location', {
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        address: address
      });

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [user, profile?.shareLocation]);

  // Simple geocoding (you might want to use a proper geocoding service)
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`
      );
      const data = await response.json();
      return data.results?.[0]?.formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  useEffect(() => {
    fetchFriendsLocations();
  }, [user, fetchFriendsLocations]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Friends Map</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFriendsLocations}
          disabled={loading}
          className="ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Location Permission Status */}
      {locationPermission === 'denied' && (
        <Card className="p-4 yrdly-shadow border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-100">
                Location Access Required
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-200">
                Please enable location access in your browser settings to see friends on the map.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Location Sharing Status */}
      {!profile?.shareLocation && (
        <Card className="p-4 yrdly-shadow border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Location Sharing Disabled
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Enable location sharing in settings to let friends see your location.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Map Placeholder */}
      <Card className="p-6 yrdly-shadow">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Friends Locations</h3>
            <Badge variant="secondary" className="ml-auto">
              {friendsLocations.length} online
            </Badge>
          </div>
          
          {/* Simple map representation */}
          <div className="relative bg-muted rounded-lg h-64 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Map View</p>
              <p className="text-sm text-muted-foreground">
                {friendsLocations.length > 0 
                  ? `${friendsLocations.length} friends nearby`
                  : 'No friends sharing location'
                }
              </p>
            </div>
          </div>

          {/* Friends List */}
          {friendsLocations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Nearby Friends</h4>
              <div className="space-y-2">
                {friendsLocations.map((friend) => (
                  <div key={friend.friend_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.friend_avatar_url} />
                      <AvatarFallback>{friend.friend_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{friend.friend_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {friend.location.address || `${friend.location.lat.toFixed(4)}, ${friend.location.lng.toFixed(4)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {formatLastSeen(friend.last_seen)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friendsLocations.length === 0 && !loading && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No friends sharing location</p>
              <p className="text-sm text-muted-foreground">
                Ask your friends to enable location sharing to see them on the map.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
