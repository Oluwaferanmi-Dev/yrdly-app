"use client";

import { V0BusinessDetailScreen } from "@/components/V0BusinessDetailScreen";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Business } from "@/types";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchBusiness = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            *,
            users!businesses_owner_id_fkey(
              name,
              avatar_url
            )
          `)
          .eq('id', businessId)
          .single();

        if (error) {
          console.error('Error fetching business:', error);
          return;
        }

        if (data) {
          // Transform the data to match our Business interface
          const businessData: Business = {
            id: data.id,
            owner_id: data.owner_id,
            name: data.name,
            category: data.category,
            description: data.description,
            location: data.location,
            image_urls: data.image_urls,
            created_at: data.created_at,
            rating: data.rating || 0,
            review_count: data.review_count || 0,
            hours: data.hours || "Hours not specified",
            phone: data.phone,
            email: data.email,
            website: data.website,
            owner_name: data.users?.name || "Unknown Owner",
            owner_avatar: data.users?.avatar_url,
            cover_image: data.image_urls?.[0],
            logo: data.image_urls?.[0],
            distance: "0.5 km away", // This would be calculated based on user location
            catalog: [] // Will be fetched separately
          };

          setBusiness(businessData);
        }
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  const handleMessageOwner = (business: Business, item?: any) => {
    if (item) {
      router.push(`/businesses/${businessId}/catalog/${item.id}/chat`);
    } else {
      router.push(`/businesses/${businessId}/chat`);
    }
  };

  const handleViewCatalogItem = (item: any) => {
    router.push(`/businesses/${businessId}/catalog/${item.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Business not found</h2>
        <p className="text-muted-foreground mb-4">The business you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <button 
          onClick={() => router.push('/businesses')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Back to Businesses
        </button>
      </div>
    );
  }

  return (
    <V0BusinessDetailScreen
      business={business}
      onBack={() => router.push("/businesses")}
      onMessageOwner={handleMessageOwner}
      onViewCatalogItem={handleViewCatalogItem}
    />
  );
}
