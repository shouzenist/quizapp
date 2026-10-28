import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Image from "next/image";
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
  title: "3G Quiz - SMP Negeri 3 Godean",
  description: "Platform kuis interaktif modern SMP Negeri 3 Godean. Murid cukup masukkan nama & kelas tanpa perlu registrasi.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <Suspense fallback={<header className="h-16 border-b border-slate-200 bg-white/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md py-6 text-center text-sm text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo2.png" alt="3G Quiz" width={100} height={50} className="h-5 w-auto object-contain inline-block" />
              <span className="text-slate-400">—</span>
              <span className="font-medium text-slate-600">SMP Negeri 3 Godean</span>
            </div>
            <p className="text-xs text-slate-400">
              Mendukung Vercel & Supabase PostgreSQL
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
