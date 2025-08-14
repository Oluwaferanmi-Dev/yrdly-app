
"use client";

import type { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface MarketplaceItemCardProps {
    item: Post;
}

export function MarketplaceItemCard({ item }: MarketplaceItemCardProps) {
    
    const formatPrice = (price?: number) => {
        if (price === undefined || price === null) return "Free";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    return (
        <Link href={`/posts/${item.id}`}>
            <Card className="overflow-hidden group cursor-pointer">
                <CardContent className="p-0">
                    <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                            src={item.imageUrl || `https://placehold.co/400x400.png`}
                            alt={item.text}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            data-ai-hint="product image"
                        />
                    </div>
                </CardContent>
                <CardFooter className="p-3 flex-col items-start">
                    <p className="font-semibold truncate w-full">{item.text}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                </CardFooter>
            </Card>
        </Link>
    );
}
