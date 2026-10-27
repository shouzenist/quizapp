"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { sounds } from "@/lib/sound";

export default function Home() {
  const router = useRouter();
  const [quizCode, setQuizCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quizCode.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Harap masukkan kode kuis terlebih dahulu.");
      sounds.playWrong();
      return;
    }
    sounds.playSelect();
    router.push(`/play/${clean}`);
  };

  const handleQuickCode = (code: string) => {
    sounds.playSelect();
    setQuizCode(code);
    router.push(`/play/${code}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 w-full flex-1 flex flex-col items-center">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs md:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>Platform Kuis Modern & Zero-Friction untuk Sekolah</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-center text-slate-900 tracking-tight max-w-4xl leading-tight">
          Kuis Interaktif Seru,{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
            Tanpa Perlu Login Murid
          </span>
        </h1>

        <p className="mt-4 md:mt-6 text-slate-600 text-center max-w-2xl text-base md:text-lg leading-relaxed">
          Guru cukup membagikan kode kuis atau link. Murid hanya perlu memasukkan{" "}
          <strong className="text-slate-900 font-semibold">Nama Lengkap</strong> dan{" "}
          <strong className="text-slate-900 font-semibold">Kelas</strong> untuk langsung mulai!
        </p>

        {/* Main Quiz Entry Box for Students */}
        <div className="mt-8 md:mt-12 w-full max-w-lg">
          <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/80 bg-white/95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Gabung Kuis</h2>
                <p className="text-xs text-slate-500">Masukkan kode 6 digit dari gurumu</p>
              </div>
            </div>

            <form onSubmit={handleJoinQuiz} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={quizCode}
                  onChange={(e) => {
                    setQuizCode(e.target.value.toUpperCase());
                    setErrorMsg("");
                  }}
                  placeholder="CONTOH: PINTAR"
                  className="w-full px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-widest uppercase rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300 text-slate-800 bg-slate-50/50"
                />
                {errorMsg && (
                  <p className="mt-2 text-xs text-rose-500 text-center font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Mulai Mengerjakan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Demo Quizzes */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-3">
                Mau coba langsung? Klik salah satu kuis demo siap pakai:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickCode("PINTAR")}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/60 transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Kuis Umum: PINTAR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCode("JUARA1")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200/60 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Matematika: JUARA1</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher CTA Section */}
        <div className="mt-8 flex items-center gap-3 text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200/60">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Apakah Anda seorang Guru?</span>
          <Link
            href="/guru"
            onClick={() => sounds.playSelect()}
            className="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-2 flex items-center gap-1"
          >
            Masuk Portal Guru & Buat Soal
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Key Features Grid */}
        <div className="mt-16 md:mt-24 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Zero-Friction Murid</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Murid tidak perlu registrasi email atau lupa password. Cukup masukkan nama dan kelas, langsung mulai kuis di smartphone atau komputer.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Export Excel Otomatis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Guru dapat mengunduh rekapitulasi nilai per kelas langsung dalam format file Excel (.xlsx) dengan 1 klik. Sangat praktis untuk input e-Rapor.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Anti-Curang Sederhana</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem memantau perpindahan tab peramban saat murid mengerjakan kuis dan mencatat frekuensi pindah layar untuk transparansi guru.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
