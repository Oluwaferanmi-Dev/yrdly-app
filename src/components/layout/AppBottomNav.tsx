
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ShoppingCart, Calendar, Building } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/neighbors", icon: Users, label: "Neighbors" },
  { href: "/marketplace", icon: ShoppingCart, label: "Market" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/businesses", icon: Building, label: "Businesses" },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <nav className="flex justify-around items-center h-16">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link href={href} key={href} legacyBehavior>
              <a className="flex flex-col items-center justify-center text-center w-full h-full">
                <Icon className={cn("h-6 w-6 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {label}
                </span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
