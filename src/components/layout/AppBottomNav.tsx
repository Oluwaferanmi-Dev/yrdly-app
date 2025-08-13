
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Users, Briefcase, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppBottomNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Market', icon: ShoppingCart },
    { href: '/neighbors', label: 'Neighbors', icon: Users },
    { href: '/businesses', label: 'Business', icon: Briefcase },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-20">
      <div className="flex justify-around items-center h-full">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors",
              pathname === item.href ? "text-primary" : ""
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
