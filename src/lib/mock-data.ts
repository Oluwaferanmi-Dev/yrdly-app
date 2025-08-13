
import type { User, Post, Conversation } from '@/types';

// NOTE: This mock data is not actively used in the app anymore,
// but is kept for reference or potential future testing purposes.

export const users: User[] = [
  { id: 'u1', uid: 'u1', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Lover of dogs and gardening. Always up for a chat about local plants!' },
  { id: 'u2', uid: 'u2', name: 'Bob Smith', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Local musician and dad. Ask me about my band!' },
  { id: 'u3', uid: 'u3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/100x100.png', bio: 'New to the neighborhood. Exploring all the best coffee shops.' },
  { id: 'u4', uid: 'u4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Community organizer and history buff.' },
];

export const posts: Post[] = [
  {
    id: 'p1',
    user: { id: 'u1', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/100x100.png' },
    category: 'General',
    text: "Just saw a family of deer on Maple Ave! So beautiful. Remember to drive safely, everyone. 🦌",
    likes: 24,
    comments: [
      { id: 'c1', user: users[1], text: "Wow, that's amazing! I'll keep an eye out.", timestamp: '2 hours ago' },
      { id: 'c2', user: users[2], text: 'So cool! Thanks for the heads up.', timestamp: '1 hour ago' },
    ],
    timestamp: '3 hours ago',
  },
  {
    id: 'p2',
    user: { id: 'u2', name: 'Bob Smith', avatarUrl: 'https://placehold.co/100x100.png' },
    category: 'Event',
    text: "Community picnic this Saturday at Oakwood Park! My band 'The Suburbans' will be playing a set at 2 PM. Bring a blanket and some snacks. Hope to see you all there!",
    imageUrl: 'https://placehold.co/600x400.png',
    location: 'Oakwood Park',
    likes: 45,
    comments: [],
    timestamp: '1 day ago',
  },
  {
    id: 'p3',
    user: { id: 'u3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/100x100.png' },
    category: 'For Sale',
    text: "Selling my trusty bicycle. It's a great ride for getting around the neighborhood. Barely used, recently serviced. DM me if you're interested! Asking $150.",
    imageUrl: 'https://placehold.co/600x400.png',
    likes: 12,
    comments: [
       { id: 'c3', user: users[3], text: 'DM sent!', timestamp: '5 hours ago' },
    ],
    timestamp: '2 days ago',
  },
  {
    id: 'p4',
    user: { id: 'u4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/100x100.png' },
    category: 'General',
    text: "Does anyone have a recommendation for a reliable plumber? We have a leaky faucet that's driving us crazy. Thanks in advance!",
    likes: 8,
    comments: [],
    timestamp: '3 days ago',
  },
];

export const conversations: Conversation[] = [
  {
    id: 'conv1',
    participant: users[1],
    messages: [
      { id: 'm1', sender: users[1], text: 'Hey, are you free for coffee this week?', timestamp: '10:30 AM', read: true },
      { id: 'm2', sender: users[0], text: "Hi Bob! I'd love to. How about Wednesday morning?", timestamp: '10:32 AM', read: true },
      { id: 'm3', sender: users[1], text: 'Perfect! See you then.', timestamp: '10:33 AM', read: false },
    ],
  },
  {
    id: 'conv2',
    participant: users[2],
    messages: [
      { id: 'm4', sender: users[0], text: 'Thanks for the bike! It rides like a dream.', timestamp: 'Yesterday', read: true },
      { id: 'm5', sender: users[2], text: "So glad you like it! Enjoy the ride.", timestamp: 'Yesterday', read: true },
    ],
  },
   {
    id: 'conv3',
    participant: users[3],
    messages: [
      { id: 'm6', sender: users[3], text: 'I saw your post about the plumber. Did you find someone good?', timestamp: '4:15 PM', read: true },
    ],
  },
];
