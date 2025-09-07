"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BuyButton } from '@/components/escrow/BuyButton';
import { ChatButton } from '@/components/escrow/ChatButton';
import { useAuth } from '@/hooks/use-auth';
import { Edit, Trash2, MapPin, User, Calendar } from 'lucide-react';
import { Post } from '@/types';

interface EnhancedItemCardProps {
  item: Post;
  onEditItem?: (item: Post) => void;
  onDeleteItem?: (itemId: string) => void;
}

export function EnhancedItemCard({ item, onEditItem, onDeleteItem }: EnhancedItemCardProps) {
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.uid === item.userId;
  const hasImages = item.imageUrls && item.imageUrls.length > 0;
  const firstImage = hasImages && item.imageUrls ? item.imageUrls[0] : '/placeholder-item.jpg';

  const handleDelete = async () => {
    if (!onDeleteItem) return;
    
    setIsDeleting(true);
    try {
      await onDeleteItem(item.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={firstImage}
            alt={item.title || 'Item image'}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Price Badge */}
          {item.price && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-semibold">
                {formatPrice(item.price)}
              </Badge>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="absolute top-3 left-3 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                onClick={() => onEditItem?.(item)}
              >
                <Edit className="w-4 h-4 text-gray-700" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="w-8 h-8 p-0 bg-red-500/90 hover:bg-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 text-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              {item.title || item.text}
            </h3>
            
            {item.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-1">
          <div className="space-y-3">
            {/* Price */}
            {item.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatPrice(item.price)}
                </span>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Your Neighborhood</span>
            </div>

            {/* Author */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{item.authorName || 'Unknown Seller'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Posted {formatDate(item.timestamp)}</span>
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="pt-0">
          <div className="w-full space-y-3">
            {/* Buy Button - Only show if not owner */}
            {!isOwner && item.price && (
              <BuyButton
                itemId={item.id}
                itemTitle={item.title || item.text || 'Unknown Item'}
                price={item.price}
                sellerId={item.userId}
                sellerName={item.authorName || 'Unknown Seller'}
              />
            )}

            {/* Chat Button - Only show if not owner */}
            {!isOwner && (
              <ChatButton
                itemId={item.id}
                itemTitle={item.title || item.text || 'Unknown Item'}
                itemImageUrl={firstImage}
                sellerId={item.userId}
                sellerName={item.authorName || 'Unknown Seller'}
              />
            )}

            {/* Owner Message */}
            {isOwner && (
              <div className="text-center text-sm text-gray-500 py-2">
                This is your item. Use the edit/delete buttons above to manage it.
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete &quot;{item.title || item.text}&quot;? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
