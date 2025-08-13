"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const usersQuery = query(
                    collection(db, 'users'),
                    where('name', '>=', searchTerm),
                    where('name', '<=', searchTerm + '\uf8ff')
                );
                const querySnapshot = await getDocs(usersQuery);
                const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setResults(usersData);
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

    const handleUserClick = (userId: string) => {
        onOpenChange(false);
        router.push(`/users/${userId}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Search Yrdly</DialogTitle>
                </DialogHeader>
                <div className="p-4 pb-0">
                    <Input
                        placeholder="Search for neighbors, posts, or businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="p-4 min-h-[200px]">
                    {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                    {!loading && results.length > 0 && (
                        <div className="space-y-4">
                            {results.map(user => (
                                <div key={user.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleUserClick(user.uid)}>
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.location?.lga}, {user.location?.state}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && results.length === 0 && searchTerm.length > 1 && (
                        <div className="text-center text-muted-foreground pt-10">
                            <p>No results found for "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
