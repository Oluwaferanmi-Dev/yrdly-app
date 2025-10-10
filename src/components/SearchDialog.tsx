
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Post, FriendRequest, Business } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Calendar, Map, ShoppingCart, FileText, Image as ImageIcon, Briefcase, Star } from 'lucide-react';
import { UserProfileDialog } from './UserProfileDialog';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useKeyboardNavigation, useFocusManagement } from '@/hooks/use-keyboard-navigation';
import Image from 'next/image';


type SearchResult = 
    | { type: 'user'; data: User }
    | { type: 'post'; data: Post }
    | { type: 'business'; data: Business }
    | { type: 'page'; data: { name: string; path: string; icon: React.ElementType }};

const allPages = [
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Map', path: '/map', icon: Map },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingCart },
    { name: 'Community', path: '/neighbors', icon: UserIcon },
    { name: 'Businesses', path: '/businesses', icon: Briefcase },
];

type FriendshipStatus = 'friends' | 'request_sent' | 'request_received' | 'none';

export function SearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void; }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { user: currentUser, profile: userDetails } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const { focusFirstElement } = useFocusManagement();

    const handleResultClick = (result: SearchResult) => {
        onOpenChange(false);
        setSearchTerm('');
        setResults([]);
        if (result.type === 'user') {
            setSelectedUser(result.data);
        } else if (result.type === 'page') {
            router.push(result.data.path);
        } else if (result.type === 'post') {
            router.push(`/posts/${result.data.id}`);
        } else if (result.type === 'business') {
            router.push(`/businesses/${result.data.id}`);
        }
    };

    // Keyboard navigation
    useKeyboardNavigation({
        onArrowDown: () => {
            if (results.length > 0) {
                setSelectedIndex(prev => (prev + 1) % results.length);
            }
        },
        onArrowUp: () => {
            if (results.length > 0) {
                setSelectedIndex(prev => prev === 0 ? results.length - 1 : prev - 1);
            }
        },
        onEnter: () => {
            if (results.length > 0 && selectedIndex < results.length) {
                handleResultClick(results[selectedIndex]);
            }
        },
        onEscape: () => {
            onOpenChange(false);
        },
        enabled: open,
    });

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);

            try {
                const searchResults: SearchResult[] = [];
                const lowerCaseSearchTerm = searchTerm.toLowerCase();

                // Page search
                const pageResults = allPages
                    .filter(page => page.name.toLowerCase().includes(lowerCaseSearchTerm))
                    .map(page => ({ type: 'page', data: page } as SearchResult));
                searchResults.push(...pageResults);

                // User search
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
                
                if (!usersError && usersData) {
                    const usersResults = usersData.map(user => ({ type: 'user', data: user as User } as SearchResult));
                    searchResults.push(...usersResults);
                }
                
                // Post search (listings and events)
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('*')
                    .or(`text.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
                
                if (!postsError && postsData) {
                    const postsResults = postsData
                        .filter(post => 
                            post.text?.toLowerCase().includes(lowerCaseSearchTerm) || 
                            post.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
                            post.description?.toLowerCase().includes(lowerCaseSearchTerm)
                        )
                        .map(post => ({ type: 'post', data: post as Post } as SearchResult));
                    searchResults.push(...postsResults);
                }

                // Business search
                const { data: businessesData, error: businessesError } = await supabase
                    .from('businesses')
                    .select('*')
                    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
                
                if (!businessesError && businessesData) {
                    const businessesResults = businessesData.map(business => {
                        // Transform the data to match our Business interface
                        const businessData: Business = {
                            id: business.id,
                            owner_id: business.owner_id,
                            name: business.name,
                            category: business.category,
                            description: business.description,
                            location: business.location,
                            image_urls: business.image_urls,
                            created_at: business.created_at,
                            rating: business.rating || 0,
                            review_count: business.review_count || 0,
                            hours: business.hours || "Hours not specified",
                            phone: business.phone,
                            email: business.email,
                            website: business.website,
                            owner_name: business.owner_name || "Unknown Owner",
                            owner_avatar: business.owner_avatar,
                            cover_image: business.image_urls?.[0],
                            logo: business.image_urls?.[0],
                            distance: "0.5 km away", // This would be calculated based on user location
                            catalog: [] // Will be fetched separately
                        };
                        return { type: 'business', data: businessData } as SearchResult;
                    });
                    searchResults.push(...businessesResults);
                }

                setResults(searchResults);
            } catch (error) {
                console.error("Error searching:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimeout = setTimeout(() => {
            performSearch();
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceTimeout);
    }, [searchTerm]);
    
    const renderResult = (result: SearchResult, index?: number) => {
        switch(result.type) {
            case 'user':
                const user = result.data;
                return (
                    <div key={`user-${user.id}`} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {user.location?.lga && <span>{user.location.lga}</span>}
                                {user.location?.state && <span>• {user.location.state}</span>}
                                {user.bio && <span>• {user.bio}</span>}
                            </div>
                        </div>
                    </div>
                );
            case 'post':
                const post = result.data;
                const hasImages = post.image_urls && post.image_urls.length > 0;
                const firstImage = hasImages && post.image_urls ? post.image_urls[0] : null;
                const Icon = post.category === 'Event' ? Calendar : post.category === 'For Sale' ? ShoppingCart : FileText;
                
                return (
                    <div key={`post-${post.id}`} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        {/* Image or Icon */}
                        <div className="flex-shrink-0">
                            {firstImage ? (
                                <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                    <Image
                                        src={firstImage}
                                        alt={post.title || post.text}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <Icon className="h-6 w-6 text-muted-foreground"/>
                                </div>
                            )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold truncate">{post.title || post.text}</p>
                                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                                    {post.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>by {post.author_name}</span>
                                {post.price && (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                        ₦{post.price.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'business':
                const business = result.data;
                return (
                    <div key={`business-${business.id}`} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        {/* Business Image or Icon */}
                        <div className="flex-shrink-0">
                            {business.cover_image ? (
                                <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                    <Image
                                        src={business.cover_image}
                                        alt={business.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <Briefcase className="h-6 w-6 text-muted-foreground"/>
                                </div>
                            )}
                        </div>
                        
                        {/* Business Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold truncate">{business.name}</p>
                                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                                    {business.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>by {business.owner_name}</span>
                                {business.rating && business.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>{business.rating.toFixed(1)}</span>
                                        {business.review_count && business.review_count > 0 && (
                                            <span>({business.review_count})</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'page':
                const page = result.data;
                return (
                    <div key={`page-${page.path}`} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <page.icon className="h-6 w-6 text-muted-foreground"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">{page.name}</p>
                            <p className="text-sm text-muted-foreground">Navigate to page</p>
                        </div>
                    </div>
                );
        }
    }

    return (
        <>
        {selectedUser && <UserProfileDialog 
            user={selectedUser}
            open={!!selectedUser} 
            onOpenChange={(wasChanged) => !open && setSelectedUser(null)} 
        />}
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Search Yrdly</DialogTitle>
                </DialogHeader>
                <div className="p-4 pb-0">
                    <Input
                        placeholder="Search for anything..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="p-4 min-h-[200px]">
                    {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                    {!loading && results.length > 0 && (
                        <div className="space-y-2" ref={resultsRef}>
                            {results.map((result, index) => (
                                <div
                                    key={`${result.type}-${result.type === 'page' ? result.data.path : result.data.id || index}`}
                                    className={`rounded-md cursor-pointer transition-colors ${
                                        index === selectedIndex 
                                            ? 'bg-primary/10 border border-primary/20' 
                                            : 'hover:bg-muted'
                                    }`}
                                    onClick={() => handleResultClick(result)}
                                    role="option"
                                    tabIndex={0}
                                    aria-selected={index === selectedIndex}
                                >
                                    {renderResult(result, index)}
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && results.length === 0 && searchTerm.length > 1 && (
                        <div className="text-center text-muted-foreground pt-10">
                            <p>No results found for &quot;{searchTerm}&quot;</p>
                        </div>
                    )}
                     {!loading && results.length === 0 && searchTerm.length < 2 && (
                        <div className="text-center text-muted-foreground pt-10">
                            <p>Search for people, posts, events, and more.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
