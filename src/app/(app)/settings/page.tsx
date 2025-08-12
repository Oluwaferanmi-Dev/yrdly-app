
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { auth, db, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Location } from "@/types";

type GeoData = {
    id: number;
    name: string;
    state_id?: number;
    local_government_id?: number;
}

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState(user?.displayName || '');
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Location state
    const [states, setStates] = useState<GeoData[]>([]);
    const [lgas, setLgas] = useState<GeoData[]>([]);
    const [cities, setCities] = useState<GeoData[]>([]);
    const [location, setLocation] = useState<Partial<Location>>({});
    const [loadingLocation, setLoadingLocation] = useState({ states: false, lgas: false, cities: false });

    // Fetch user data
    useEffect(() => {
      if (user) {
        const fetchUserData = async () => {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setBio(userData.bio || '');
            if (userData.location) {
                setLocation(userData.location);
            }
            if (!user.displayName) {
                setName(userData.name || '');
            }
          }
        };
        fetchUserData();
        if (user.displayName) {
            setName(user.displayName);
        }
      }
    }, [user]);

    // Fetch states
    useEffect(() => {
        const fetchStates = async () => {
            setLoadingLocation(prev => ({ ...prev, states: true }));
            try {
                const response = await fetch('/api/geo/states');
                const data = await response.json();
                if (data.success) {
                    setStates(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch states", error);
            } finally {
                setLoadingLocation(prev => ({ ...prev, states: false }));
            }
        }
        fetchStates();
    }, []);

    // Fetch LGAs when state changes
    useEffect(() => {
        if (location.stateId) {
            const fetchLgas = async () => {
                setLoadingLocation(prev => ({ ...prev, lgas: true }));
                setLgas([]);
                setCities([]);
                try {
                    const response = await fetch(`/api/geo/lgas/${location.stateId}`);
                    const data = await response.json();
                    if (data.success) {
                        setLgas(data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch LGAs", error);
                } finally {
                    setLoadingLocation(prev => ({ ...prev, lgas: false }));
                }
            }
            fetchLgas();
        }
    }, [location.stateId]);

    // Fetch cities when LGA changes
     useEffect(() => {
        if (location.lgaId) {
            const fetchCities = async () => {
                setLoadingLocation(prev => ({ ...prev, cities: true }));
                setCities([]);
                try {
                    const response = await fetch(`/api/geo/cities/${location.lgaId}`);
                    const data = await response.json();
                    if (data.success) {
                        setCities(data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch cities", error);
                } finally {
                    setLoadingLocation(prev => ({ ...prev, cities: false }));
                }
            }
            fetchCities();
        }
    }, [location.lgaId]);


    const handleLocationChange = (type: 'state' | 'lga' | 'city', value: string) => {
        const selectedId = parseInt(value);
        let selectedName = '';
        let newState = { ...location };

        if (type === 'state') {
            selectedName = states.find(s => s.id === selectedId)?.name || '';
            newState = { state: selectedName, stateId: selectedId, lga: undefined, lgaId: undefined, city: undefined, cityId: undefined };
        } else if (type === 'lga') {
            selectedName = lgas.find(l => l.id === selectedId)?.name || '';
            newState = { ...newState, lga: selectedName, lgaId: selectedId, city: undefined, cityId: undefined };
        } else if (type === 'city') {
            selectedName = cities.find(c => c.id === selectedId)?.name || '';
            newState = { ...newState, city: selectedName, cityId: selectedId };
        }
        
        setLocation(newState);
    };

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePic(e.target.files[0]);
        }
    };

    const handleProfileUpdate = async () => {
        if (!user) return;
        setUploading(true);
        try {
            let photoURL = user.photoURL;

            if (profilePic) {
                const storageRef = ref(storage, `avatars/${user.uid}/${profilePic.name}`);
                const snapshot = await uploadBytes(storageRef, profilePic);
                photoURL = await getDownloadURL(snapshot.ref);
            }

            await updateProfile(user, {
                displayName: name,
                photoURL: photoURL,
            });

            await setDoc(doc(db, "users", user.uid), {
                name: name,
                bio: bio,
                location: location,
                avatarUrl: photoURL,
                email: user.email
            }, { merge: true });

            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        } catch (error) {
            console.error("Error updating profile: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
        } finally {
            setUploading(false);
        }
    };


    const handleLogout = async () => {
      await auth.signOut();
      router.push('/login');
    }

  return (
    <div className="max-w-3xl mx-auto">
        <div className="mb-6">
            <h1 className="text-2xl font-bold font-headline">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                This is how others will see you on the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} data-ai-hint="person portrait" />
                        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <Label htmlFor="picture">Profile Picture</Label>
                        <Input id="picture" type="file" onChange={handleProfilePicChange} accept="image/*" />
                    </div>
                </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

               <div className="space-y-2">
                <Label>Location</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Select onValueChange={(val) => handleLocationChange('state', val)} value={String(location.stateId || '')} disabled={loadingLocation.states}>
                        <SelectTrigger><SelectValue placeholder={loadingLocation.states ? "Loading..." : "Select State"} /></SelectTrigger>
                        <SelectContent>
                            {states.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                     <Select onValueChange={(val) => handleLocationChange('lga', val)} value={String(location.lgaId || '')} disabled={!location.stateId || loadingLocation.lgas}>
                        <SelectTrigger><SelectValue placeholder={loadingLocation.lgas ? "Loading..." : "Select LGA"} /></SelectTrigger>
                        <SelectContent>
                            {lgas.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                     <Select onValueChange={(val) => handleLocationChange('city', val)} value={String(location.cityId || '')} disabled={!location.lgaId || loadingLocation.cities}>
                        <SelectTrigger><SelectValue placeholder={loadingLocation.cities ? "Loading..." : "Select City/Town"} /></SelectTrigger>
                        <SelectContent>
                             {cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself" className="min-h-[100px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={uploading}>{uploading ? 'Saving...' : 'Save Changes'}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. After saving, you'll be logged out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device.</p>
                </div>
                <Switch defaultChecked />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Email Newsletter</Label>
                    <p className="text-sm text-muted-foreground">Get weekly updates on neighborhood activity.</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">New Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">Be notified when you receive a new message.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
             <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-6 border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Logout</CardTitle>
              <CardDescription>Logs you out of your account on this device.</CardDescription>
          </CardHeader>
          <CardFooter>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </CardFooter>
      </Card>
    </div>
  );
}
