
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { User } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allStates, lgasByState, wardsByLga } from "@/lib/geo-data";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<User['location']>({});
  const [wardsForSelectedLga, setWardsForSelectedLga] = useState<string[]>([]);


  // Fetch user data
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          setBio(userData.bio || "");
          if (userData.location) {
            setLocation(userData.location);
            if (userData.location.lga) {
                setWardsForSelectedLga(wardsByLga[userData.location.lga] || []);
            }
          }
          if (!user.displayName) {
            setName(userData.name || "");
          }
        }
      };
      fetchUserData();
      if (user.displayName) {
        setName(user.displayName);
      }
    }
  }, [user]);

  const handleLocationChange = (type: keyof User['location'], value: string) => {
    setLocation(prev => {
        const newLocation = { ...prev, [type]: value };
        if (type === "state") {
          newLocation.lga = "";
          newLocation.ward = "";
        }
        if (type === "lga") {
          newLocation.ward = "";
          setWardsForSelectedLga(wardsByLga[value] || []);
        }
        return newLocation;
    });
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
        photoURL: photoURL
      });

      const userData: Partial<User> = {
        name: name,
        bio: bio,
        location: location,
        avatarUrl: photoURL || user.photoURL || undefined,
        email: user.email || undefined,
      };

      await setDoc(doc(db, "users", user.uid), userData, { merge: true } );

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
    router.push("/login");
  };

  const lgasForSelectedState = location?.state ? lgasByState[location.state] : [];

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
              <CardDescription>This is how others will see you on the site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs">State</Label>
                    <Select value={location?.state || ""} onValueChange={(value) => handleLocationChange("state", value)}>
                      <SelectTrigger id="state"><SelectValue placeholder="Select your state" /></SelectTrigger>
                      <SelectContent>{allStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lga" className="text-xs">LGA</Label>
                    <Select value={location?.lga || ""} onValueChange={(value) => handleLocationChange("lga", value)} disabled={!location?.state}>
                      <SelectTrigger id="lga"><SelectValue placeholder="Select your LGA" /></SelectTrigger>
                      <SelectContent>{lgasForSelectedState.map((lga) => (<SelectItem key={lga} value={lga}>{lga}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ward" className="text-xs">Ward</Label>
                    <Select value={location?.ward || ""} onValueChange={(value) => handleLocationChange("ward", value)} disabled={!location?.lga}>
                      <SelectTrigger id="ward"><SelectValue placeholder="Select your Ward" /></SelectTrigger>
                      <SelectContent>{wardsForSelectedLga.map((ward) => (<SelectItem key={ward} value={ward}>{ward}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs">City / Town / Street</Label>
                    <Input id="city" placeholder="e.g. Opebi Street" value={location?.city || ""} onChange={(e) => handleLocationChange("city", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself" className="min-h-[100px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={uploading}>
                {uploading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password here. After saving, you&apos;ll be logged out.</CardDescription>
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
              <CardDescription>Choose what you want to be notified about and where you receive them.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.push('/settings/notifications')}>
                    Manage Notification Settings
                </Button>
            </CardContent>
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
