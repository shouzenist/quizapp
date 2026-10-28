"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Volume2, VolumeX, Database, GraduationCap, Lock } from "lucide-react";
import { sounds } from "@/lib/sound";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const [soundActive, setSoundActive] = useState(true);

  useEffect(() => {
    sounds.setEnabled(soundActive);
  }, [soundActive]);

  const toggleSound = () => {
    const newState = !soundActive;
    setSoundActive(newState);
    sounds.setEnabled(newState);
    if (newState) {
      sounds.playSelect();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-95"
          onClick={() => sounds.playSelect()}
        >
          <div className="relative h-9 w-12 flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Logo 3G Quiz"
              width={64}
              height={42}
              className="h-full w-auto object-contain drop-shadow-xs"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-950 via-blue-700 to-sky-500 bg-clip-text text-transparent tracking-tight">
              3G Quiz
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full bg-blue-50 text-blue-800 border border-blue-200/80">
              SMP Negeri 3 Godean
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>{isSupabaseConfigured ? "Supabase Live" : "Mode Demo Siap"}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? "Nonaktifkan Suara" : "Aktifkan Suara"}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-colors"
          >
            {soundActive ? (
              <Volume2 className="w-5 h-5 text-blue-700" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Role Navigation */}
          <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <Link
              href="/"
              onClick={() => sounds.playSelect()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === "/" || pathname?.startsWith("/play")
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Murid</span>
            </Link>

            <Link
              href="/guru"
              onClick={() => sounds.playSelect()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname?.startsWith("/guru")
                  ? "bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 text-white shadow-sm shadow-blue-900/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Portal Guru</span>
              <Lock className="w-3 h-3 opacity-60 ml-0.5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
