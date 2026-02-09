'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { MapPin } from 'lucide-react';
import type { Post } from '@/types';

export function HomeRightSidebar() {
  const [events, setEvents] = useState<(Post & { user?: { name?: string; avatar_url?: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          text,
          event_date,
          event_location,
          image_urls,
          attendees,
          user:users!posts_user_id_fkey(name, avatar_url)
        `)
        .eq('category', 'Event')
        .order('timestamp', { ascending: false })
        .limit(4);

      if (!error) setEvents((data as any) || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getLocation = (loc: unknown): string => {
    if (!loc || typeof loc !== 'object') return '';
    const o = loc as Record<string, unknown>;
    if (typeof o.address === 'string') return o.address;
    return '';
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[313px] lg:flex-shrink-0 lg:overflow-y-auto">
      {/* Latest Events */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg leading-8 text-white"
            style={{ fontFamily: '"Pacifico", cursive' }}
          >
            Latest Events
          </h2>
          <Link
            href="/events"
            className="font-raleway font-medium text-xs text-[#1976D2] hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="space-y-3 rounded-md overflow-hidden" style={{ background: '#1E2126' }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-[120px] rounded bg-[#15181D] animate-pulse" />
              ))}
            </div>
          ) : (
            events.slice(0, 2).map((event) => (
              <Link
                key={event.id}
                href={`/posts/${event.id}`}
                className="block p-3 hover:bg-white/5 transition"
              >
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded flex-shrink-0 bg-[#15181D] overflow-hidden"
                    style={{ borderRadius: 3 }}
                  >
                    {event.image_urls?.[0] ? (
                      <Image
                        src={event.image_urls[0]}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#15181D]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-raleway font-medium italic text-[11px] text-white truncate">
                      {event.title || 'Event'}
                    </p>
                    <p className="font-raleway text-[6px] text-white/80 mt-0.5">
                      {formatDate(event.event_date ?? null)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-white/70">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="font-raleway text-[9px] truncate">
                        {getLocation(event.event_location) || event.text?.slice(0, 40) || '—'}
                      </span>
                    </div>
                    <p className="font-raleway text-[7px] text-white/60 mt-1">
                      {(event.attendees?.length || 0)} are interested
                    </p>
                    <span
                      className="inline-block mt-2 px-2 py-1 rounded-full font-raleway text-[9px] text-white"
                      style={{ background: '#388E3C', borderRadius: 11.5 }}
                    >
                      I&apos;m Interested
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Sales */}
      <div className="p-4 pt-0">
        <h2
          className="text-lg leading-8 text-white mb-3"
          style={{ fontFamily: '"Pacifico", cursive' }}
        >
          Quick Sales
        </h2>
        <div
          className="rounded-md p-4 min-h-[80px]"
          style={{ background: '#1E2126' }}
        >
          <p className="font-raleway text-xs text-white/60">No quick sales yet.</p>
        </div>
      </div>
    </aside>
  );
}
