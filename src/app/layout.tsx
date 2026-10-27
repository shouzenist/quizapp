import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizPintar - Kuis Interaktif Guru & Murid",
  description: "Platform kuis interaktif modern untuk sekolah. Murid cukup masukkan nama & kelas tanpa perlu registrasi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <Suspense fallback={<header className="h-16 border-b border-slate-200 bg-white/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md py-6 text-center text-sm text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-indigo-600">QuizPintar</span> — Platform Kuis Interaktif Tanpa Ribet
            </p>
            <p className="text-xs text-slate-400">
              Mendukung Vercel & Supabase PostgreSQL
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
