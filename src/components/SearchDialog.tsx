
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, or, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Post, FriendRequest } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Calendar, Map, ShoppingCart, FileText } from 'lucide-react';
import { UserProfileDialog } from './UserProfileDialog';
import { useAuth } from '@/hooks/use-auth';


type SearchResult = 
    | { type: 'user'; data: User }
    | { type: 'post'; data: Post }
    | { type: 'page'; data: { name: string; path: string; icon: React.ElementType }};

const allPages = [
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Map', path: '/map', icon: Map },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingCart },
    { name: 'Community', path: '/neighbors', icon: UserIcon },
];

type FriendshipStatus = 'friends' | 'request_sent' | 'request_received' | 'none';

export function SearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void; }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user: currentUser, userDetails } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        }
    };

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
                const usersQuery = query(
                    collection(db, 'users'),
                    where('name', '>=', searchTerm),
                    where('name', '<=', searchTerm + '\uf8ff')
                );
                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.map(doc => ({ type: 'user', data: { id: doc.id, ...doc.data() } as User } as SearchResult));
                searchResults.push(...usersData);
                
                // Post search (listings and events)
                const postsQuery = query(
                    collection(db, 'posts'),
                    or(
                        where('text', '>=', searchTerm),
                        where('text', '<=', searchTerm + '\uf8ff'),
                        where('title', '>=', searchTerm),
                        where('title', '<=', searchTerm + '\uf8ff')
                    )
                );
                const postsSnapshot = await getDocs(postsQuery);
                const postsData = postsSnapshot.docs
                    .filter(doc => doc.data().text?.toLowerCase().includes(lowerCaseSearchTerm) || doc.data().title?.toLowerCase().includes(lowerCaseSearchTerm))
                    .map(doc => ({ type: 'post', data: { id: doc.id, ...doc.data() } as Post } as SearchResult));
                searchResults.push(...postsData);

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
    
    const renderResult = (result: SearchResult) => {
        switch(result.type) {
            case 'user':
                const user = result.data;
                return (
                    <div key={`user-${user.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        <Avatar className="h-9 w-9"><AvatarImage src={user.avatarUrl} alt={user.name} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                        <div><p className="font-semibold">{user.name}</p><p className="text-sm text-muted-foreground">{user.location?.lga}</p></div>
                    </div>
                );
            case 'post':
                const post = result.data;
                const Icon = post.category === 'Event' ? Calendar : FileText;
                return (
                    <div key={`post-${post.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        <div className="bg-muted p-2 rounded-md"><Icon className="h-5 w-5 text-muted-foreground"/></div>
                        <div><p className="font-semibold">{post.title || post.text}</p><p className="text-sm text-muted-foreground">{post.category}</p></div>
                    </div>
                );
            case 'page':
                const page = result.data;
                return (
                    <div key={`page-${page.path}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleResultClick(result)}>
                        <div className="bg-muted p-2 rounded-md"><page.icon className="h-5 w-5 text-muted-foreground"/></div>
                        <div><p className="font-semibold">{page.name}</p><p className="text-sm text-muted-foreground">Page</p></div>
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
                        <div className="space-y-2">
                            {results.map(renderResult)}
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
