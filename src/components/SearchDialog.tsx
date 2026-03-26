"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Post, Business } from "../types";
import { useRouter } from 'next/navigation';
import { X, Search, Clock, ChevronRight, Star, UserPlus } from 'lucide-react';
import { UserProfileDialog } from './UserProfileDialog';
import { useAuth } from '@/hooks/use-supabase-auth';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';

const GREEN      = "#388E3C";
const GREEN_LIGHT = "#82DB7E";
const CARD       = "#1d2025";
const CARD_HIGH  = "#272a2f";
const BG         = "#101418";

type ActiveTab = 'all' | 'people' | 'posts' | 'events' | 'businesses' | 'items';

type SearchResult =
  | { type: 'user';     data: User }
  | { type: 'post';     data: Post }
  | { type: 'business'; data: Business };

const RECENT_KEY = 'yrdly_recent_searches';
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(term: string) {
  const prev = getRecent().filter(t => t !== term).slice(0, 9);
  localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev]));
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [searchTerm, setSearchTerm]   = useState('');
  const [activeTab, setActiveTab]     = useState<ActiveTab>('all');
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [recents, setRecents]         = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (open) {
      setRecents(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setSearchTerm('');
      setResults([]);
      setActiveTab('all');
    }
  }, [open]);

  useKeyboardNavigation({ onEscape: () => onOpenChange(false), enabled: open });

  useEffect(() => {
    if (searchTerm.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const found: SearchResult[] = [];
        const q = searchTerm;

        const { data: users } = await supabase.from('users').select('id, uid, name, avatar_url, bio, location, interests, created_at').or(`name.ilike.%${q}%,bio.ilike.%${q}%`).neq('id', currentUser?.id ?? '').limit(5);
        (users || []).forEach(u => found.push({ type: 'user', data: u as User }));

        const { data: posts } = await supabase.from('posts').select('*').or(`text.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`).limit(5);
        (posts || []).forEach(p => found.push({ type: 'post', data: p as Post }));

        const { data: businesses } = await supabase.from('businesses').select('*').or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`).limit(5);
        (businesses || []).forEach(b => found.push({ type: 'business', data: b as Business }));

        setResults(found);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentUser?.id]);

  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'people') return r.type === 'user';
    if (activeTab === 'posts') return r.type === 'post';
    if (activeTab === 'events') return r.type === 'post' && (r.data as Post).category === 'Event';
    if (activeTab === 'businesses') return r.type === 'business';
    if (activeTab === 'items') return r.type === 'post' && (r.data as Post).category === 'For Sale';
    return true;
  });

  const users     = filteredResults.filter(r => r.type === 'user') as { type: 'user'; data: User }[];
  const posts     = filteredResults.filter(r => r.type === 'post' && (r.data as Post).category !== 'Event' && (r.data as Post).category !== 'For Sale') as { type: 'post'; data: Post }[];
  const events    = filteredResults.filter(r => r.type === 'post' && (r.data as Post).category === 'Event') as { type: 'post'; data: Post }[];
  const businesses = filteredResults.filter(r => r.type === 'business') as { type: 'business'; data: Business }[];
  const items     = filteredResults.filter(r => r.type === 'post' && (r.data as Post).category === 'For Sale') as { type: 'post'; data: Post }[];

  const handleGo = (result: SearchResult) => {
    if (searchTerm) saveRecent(searchTerm);
    onOpenChange(false);
    if (result.type === 'user')     { setSelectedUser(result.data); }
    else if (result.type === 'post') router.push(`/posts/${result.data.id}`);
    else if (result.type === 'business') router.push(`/businesses/${result.data.id}`);
  };

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'people',     label: 'People' },
    { key: 'posts',      label: 'Posts' },
    { key: 'events',     label: 'Events' },
    { key: 'businesses', label: 'Businesses' },
    { key: 'items',      label: 'Items' },
  ];

  if (!open) return null;

  return (
    <>
      {selectedUser && (
        <UserProfileDialog user={selectedUser} open={!!selectedUser} onOpenChange={() => setSelectedUser(null)} />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={e => e.target === e.currentTarget && onOpenChange(false)}
      >
        {/* Panel */}
        <div
          className="w-full max-w-2xl flex flex-col md:mt-12 md:rounded-[20px] overflow-hidden"
          style={{
            background: "#191c21",
            minHeight: '100dvh',
            maxHeight: '100dvh',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Search bar */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(64,73,61,0.3)' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1 transition-colors hover:bg-white/10 flex-shrink-0"
                style={{ color: '#bfcab9' }}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#899485' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search for anything..."
                  className="w-full rounded-full py-3.5 pl-11 pr-5 text-sm outline-none transition-all"
                  style={{
                    background: CARD_HIGH,
                    border: `0.5px solid ${GREEN}`,
                    color: '#e1e2e9',
                    fontFamily: 'Work Sans, sans-serif',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all"
                style={
                  activeTab === tab.key
                    ? { background: '#4da24e', color: '#003207' }
                    : { background: CARD_HIGH, color: '#bfcab9', border: '0.5px solid rgba(64,73,61,0.4)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable results */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#272a2f transparent' }}>

            {/* Recent searches (only when no search term) */}
            {!searchTerm && recents.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h2 style={{ fontFamily: 'Pacifico, cursive', color: '#e1e2e9', fontSize: 20 }}>Recent</h2>
                  <button
                    onClick={() => { localStorage.removeItem(RECENT_KEY); setRecents([]); }}
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: GREEN_LIGHT }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recents.map(r => (
                    <button
                      key={r}
                      onClick={() => setSearchTerm(r)}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ background: CARD, color: '#e1e2e9', fontFamily: 'Work Sans, sans-serif' }}
                    >
                      <Clock className="w-4 h-4" style={{ color: '#899485' }} />
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center pt-10">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Empty state */}
            {!loading && searchTerm.length >= 2 && filteredResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="w-14 h-14 mb-4" style={{ color: GREEN, opacity: 0.3 }} />
                <p style={{ fontFamily: 'Pacifico, cursive', color: '#e1e2e9', fontSize: 20 }}>Nothing found</p>
                <p className="mt-2 text-sm" style={{ color: '#bfcab9', fontFamily: 'Work Sans, sans-serif' }}>Try a different search</p>
              </div>
            )}

            {/* People */}
            {!loading && users.length > 0 && (
              <section>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#bfcab9', fontFamily: 'Raleway, sans-serif' }}>
                  Suggested People
                </h3>
                <div className="space-y-2">
                  {users.map(({ data: u }) => (
                    <div
                      key={u.id}
                      onClick={() => handleGo({ type: 'user', data: u })}
                      className="flex items-center gap-4 p-3 rounded-[11px] cursor-pointer transition-colors hover:bg-white/5"
                      style={{ background: CARD }}
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0" style={{ border: `1px solid rgba(130,219,126,0.2)` }}>
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback style={{ background: GREEN, color: '#fff', fontFamily: 'Work Sans, sans-serif', fontWeight: 700 }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#e1e2e9' }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color: '#bfcab9' }}>
                          {[u.location?.lga, u.location?.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <button
                        className="flex-shrink-0 flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-opacity hover:opacity-90"
                        style={{ background: GREEN, color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        onClick={e => { e.stopPropagation(); handleGo({ type: 'user', data: u }); }}
                      >
                        <UserPlus className="w-3 h-3" /> Follow
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {!loading && posts.length > 0 && (
              <section>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#bfcab9', fontFamily: 'Raleway, sans-serif' }}>
                  Top Posts
                </h3>
                <div className="space-y-2">
                  {posts.map(({ data: p }) => (
                    <div
                      key={p.id}
                      onClick={() => handleGo({ type: 'post', data: p })}
                      className="p-4 rounded-[11px] cursor-pointer transition-colors hover:bg-white/5"
                      style={{ background: CARD, border: '0.5px solid rgba(64,73,61,0.3)' }}
                    >
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={p.author_image} />
                              <AvatarFallback style={{ background: GREEN, fontSize: 8 }}>{p.author_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: '#bfcab9' }}>@{p.author_name?.replace(/\s+/g, '_').toLowerCase()}</span>
                          </div>
                          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(225,226,233,0.9)' }}>{p.text}</p>
                        </div>
                        {p.image_urls?.[0] && (
                          <div className="w-20 h-20 rounded-[11px] overflow-hidden flex-shrink-0">
                            <Image src={p.image_urls[0]} alt="" fill className="object-cover" sizes="80px" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Events */}
            {!loading && events.length > 0 && (
              <section>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#bfcab9', fontFamily: 'Raleway, sans-serif' }}>
                  Upcoming Events
                </h3>
                <div className="space-y-2">
                  {events.map(({ data: ev }) => (
                    <div
                      key={ev.id}
                      onClick={() => handleGo({ type: 'post', data: ev })}
                      className="p-4 rounded-[28px] cursor-pointer flex items-center justify-between transition-colors hover:bg-white/5"
                      style={{ background: CARD, border: '0.5px solid rgba(64,73,61,0.3)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[11px] flex flex-col items-center justify-center flex-shrink-0" style={{ background: '#35a61a', color: '#053200' }}>
                          <span className="text-[10px] font-bold uppercase">{ev.event_date ? new Date(ev.event_date).toLocaleString('en', { month: 'short' }) : 'EVT'}</span>
                          <span className="text-lg font-extrabold leading-none">{ev.event_date ? new Date(ev.event_date).getDate() : '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#e1e2e9' }}>{ev.title || ev.text}</p>
                          <p className="text-xs font-medium" style={{ color: '#6edf51' }}>
                            {ev.attendees?.length ? `${ev.attendees.length} attending` : 'View event'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: '#899485' }} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Businesses */}
            {!loading && businesses.length > 0 && (
              <section>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#bfcab9', fontFamily: 'Raleway, sans-serif' }}>
                  Local Businesses
                </h3>
                <div className="space-y-2">
                  {businesses.map(({ data: b }) => (
                    <div
                      key={b.id}
                      onClick={() => handleGo({ type: 'business', data: b })}
                      className="flex items-center gap-4 p-4 rounded-[11px] cursor-pointer transition-colors hover:bg-white/5"
                      style={{ background: CARD_HIGH, border: `0.5px solid rgba(130,219,126,0.2)` }}
                    >
                      <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: '#272a2f' }}>
                        {b.image_urls?.[0]
                          ? <Image src={b.image_urls[0]} alt="" width={56} height={56} className="rounded-full object-cover w-full h-full" />
                          : '🏪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#e1e2e9' }}>{b.name}</p>
                        {b.rating && b.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-[10px] font-bold" style={{ color: '#bfcab9' }}>{b.rating.toFixed(1)} ({b.review_count ?? 0} reviews)</span>
                          </div>
                        )}
                      </div>
                      <button
                        className="flex-shrink-0 rounded-full px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest"
                        style={{ background: '#006ec9', color: '#eaf0ff' }}
                      >
                        Visit
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Marketplace items */}
            {!loading && items.length > 0 && (
              <section>
                <h3 className="mb-4 px-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#bfcab9', fontFamily: 'Raleway, sans-serif' }}>
                  Marketplace
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {items.map(({ data: item }) => (
                    <div
                      key={item.id}
                      onClick={() => handleGo({ type: 'post', data: item })}
                      className="rounded-[11px] overflow-hidden cursor-pointer group"
                      style={{ background: CARD, border: '0.5px solid rgba(64,73,61,0.3)' }}
                    >
                      <div className="h-32 overflow-hidden relative">
                        {item.image_urls?.[0]
                          ? <Image src={item.image_urls[0]} alt={item.title || ''} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="200px" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: CARD_HIGH }}>🛒</div>
                        }
                        <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight" style={{ background: '#a5c8ff', color: '#00315f' }}>Market</div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold truncate" style={{ color: '#e1e2e9' }}>{item.title || item.text}</p>
                        {item.price && <p className="text-sm font-extrabold mt-1" style={{ color: GREEN_LIGHT }}>₦{item.price.toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Brand watermark */}
            <div className="flex justify-center py-6 opacity-[0.12] pointer-events-none">
              <span style={{ fontFamily: 'Jersey 25, sans-serif', color: GREEN_LIGHT, fontSize: 28, letterSpacing: '0.2em' }}>YRDLY</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
