"use client";

import Link from "next/link";
import { ArrowLeft, Moon } from "lucide-react";

export default function AppearancePage() {
  return (
    <div className="pt-4 pb-20 px-4 max-w-2xl mx-auto space-y-6">
      <Link
        href="/settings"
        className="flex items-center gap-2 text-sm font-bold"
        style={{ color: "#82DB7E", fontFamily: "Raleway, sans-serif" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Settings
      </Link>

      <h1
        className="text-2xl font-extrabold text-white"
        style={{ fontFamily: "Raleway, sans-serif" }}
      >
        Appearance
      </h1>

      <div
        className="flex items-center gap-4 p-5 rounded-[11px]"
        style={{ background: "#1E2126" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(56,142,60,0.15)" }}
        >
          <Moon className="w-5 h-5" style={{ color: "#82DB7E" }} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm" style={{ fontFamily: "Raleway, sans-serif" }}>
            Dark Mode
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#899485", fontFamily: "Work Sans, sans-serif" }}>
            Yrdly runs in dark mode only to deliver the best visual experience.
          </p>
        </div>
        <span
          className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: "rgba(56,142,60,0.15)", color: "#82DB7E", fontFamily: "Work Sans, sans-serif" }}
        >
          Always On
        </span>
      </div>
    </div>
  );
}
