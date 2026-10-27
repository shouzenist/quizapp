"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles, BookOpen, Volume2, VolumeX, Database, GraduationCap, Lock } from "lucide-react";
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
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
          onClick={() => sounds.playSelect()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              QuizPintar
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Sekolah
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isSupabaseConfigured ? "Supabase Live" : "Mode Demo Siap"}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? "Nonaktifkan Suara" : "Aktifkan Suara"}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          >
            {soundActive ? (
              <Volume2 className="w-5 h-5 text-indigo-600" />
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
                  ? "bg-white text-indigo-700 shadow-sm"
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
                  ? "bg-indigo-600 text-white shadow-sm"
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
