
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import type { Business } from "@/types";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { CreateBusinessDialog } from "@/components/CreateBusinessDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePosts } from "@/hooks/use-posts";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

function BusinessCard({ business }: { business: Business }) {
    const { user } = useAuth();
    const { deleteBusiness } = usePosts();

    const handleDelete = () => {
        deleteBusiness(business.id);
    }

    return (
        <Card className="overflow-hidden flex flex-col h-full">
            {business.imageUrls && business.imageUrls.length > 0 ? (
                business.imageUrls.length > 1 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {business.imageUrls.map((url, index) => (
                                <CarouselItem key={index}>
                                    <AspectRatio ratio={16 / 9}>
                                        <Image
                                            src={url}
                                            alt={`${business.name} image ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </AspectRatio>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </Carousel>
                ) : (
                    <AspectRatio ratio={16 / 9}>
                        <Image
                            src={business.imageUrls[0]}
                            alt={`${business.name} image 1`}
                            fill
                            className="object-cover"
                        />
                    </AspectRatio>
                )
            ) : (
                <AspectRatio ratio={16/9}>
                    <div className="bg-muted flex items-center justify-center h-full">
                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                    </div>
                </AspectRatio>
            )}
           
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription>{business.category}</CardDescription>
                </div>
                {user?.uid === business.ownerId && (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <CreateBusinessDialog postToEdit={business}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                </CreateBusinessDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this business listing.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{business.description}</p>
            </CardContent>
            <CardFooter>
                 <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0"/>
                    <span className="truncate">{business.location.address}</span>
                </div>
            </CardFooter>
        </Card>
    )
}

function EmptyBusinesses() {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
                <Briefcase className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">No businesses yet</h2>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to add a local business to the directory!</p>
            <CreateBusinessDialog>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Business
                </Button>
            </CreatePostDialog>
        </div>
    )
}

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "businesses"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const businessesData = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                } as Business;
            });
            setBusinesses(businessesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Local businesses</h1>
            <p className="text-muted-foreground">Discover and support businesses in your neighborhood.</p>
        </div>
        <CreateBusinessDialog>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Your Business
            </Button>
        </CreatePostDialog>
       </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search businesses..." className="pl-10" />
        </div>
        
        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {businesses.map(business => (
                    <BusinessCard key={business.id} business={business} />
                ))}
            </div>
        ) : (
            <EmptyBusinesses />
        )}

    </div>
  );
}
