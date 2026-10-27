"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { sounds } from "@/lib/sound";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizCode: string;
  quizTitle: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  quizCode,
  quizTitle,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const playUrl = `${origin}/play/${quizCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    playUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(playUrl);
    setCopied(true);
    sounds.playSelect();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-200 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Bagikan ke Layar Proyektor
        </h3>
        <p className="text-xs text-slate-500 mb-6 line-clamp-1">{quizTitle}</p>

        {/* Big Code Pill */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            Kode Masuk Kuis
          </p>
          <div className="text-4xl font-black font-mono tracking-widest text-indigo-700">
            {quizCode}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`QR Code for ${quizCode}`}
              width={220}
              height={220}
              className="rounded-xl"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Murid dapat scan QR code ini dengan kamera HP untuk langsung masuk kuis.
        </p>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all bg-slate-50 hover:bg-indigo-50/50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Link Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Salin Link Kuis ({playUrl})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
