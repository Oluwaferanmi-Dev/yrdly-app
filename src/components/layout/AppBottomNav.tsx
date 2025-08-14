
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Users, Briefcase, Map, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppBottomNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/neighbors', label: 'Search', icon: Search },
    { href: '/marketplace', label: 'For Sale', icon: ShoppingCart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-transparent z-20 flex justify-center items-center pointer-events-none">
       <div className="bg-background/80 backdrop-blur-sm border rounded-full flex justify-around items-center h-16 w-64 shadow-lg pointer-events-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors w-20 h-16 rounded-full",
                isActive ? "text-primary" : ""
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
