"use client";

import Image from "next/image";

export function YrdlyLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/yrdly-logo.png" 
        alt="Yrdly Logo" 
        width={40} 
        height={40}
        className="w-10 h-10"
        priority
      />
      <span className="text-2xl font-bold text-primary">Yrdly</span>
    </div>
  );
}

