"use client";

import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Upload, X, Clipboard, Link2, Check } from "lucide-react";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}

// Compress image on client-side to keep data URL lightweight (< 100KB)
export async function compressImage(file: File, maxWidth = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use webp if supported, or jpeg
        const dataUrl = canvas.toDataURL("image/webp", quality) || canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function ImageUploader({
  value,
  onChange,
  label = "Gambar Pendukung Soal (Opsional)",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process a File object (from input, drop, or clipboard paste)
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, WEBP, dsb).");
      return;
    }
    try {
      const compressedDataUrl = await compressImage(file);
      onChange(compressedDataUrl);
    } catch {
      alert("Gagal memproses gambar.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Paste handler directly on the dropzone
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            <span>{showUrlInput ? "Tutup Input Link" : "Input Link URL"}</span>
          </button>
        )}
      </div>

      {/* URL Input Bar if toggled */}
      {showUrlInput && !value && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Tempelkan URL gambar (https://...)"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Pasang
          </button>
        </div>
      )}

      {/* If Image is Already Present: Preview Mode */}
      {value ? (
        <div className="relative group rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Ilustrasi Soal"
            className="w-full max-h-56 object-contain bg-white rounded-xl"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="p-1.5 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
              title="Hapus Gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" /> Gambar terpasang
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-700 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              Ganti Gambar
            </button>
          </div>
        </div>
      ) : (
        /* Empty State: Upload / Paste / Dropzone */
        <div
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 md:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            isDragging
              ? "border-blue-600 bg-blue-50/60"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/60 bg-slate-50/30"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 border border-blue-200">
            <ImageIcon className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-xs md:text-sm font-bold text-slate-800">
              <span className="text-blue-700 underline">Klik untuk Upload</span>, seret file ke sini, atau tekan{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                Ctrl + V
              </kbd>
            </p>
            <p className="text-[11px] text-slate-400">
              Mendukung screenshot langsung dari clipboard, JPG, PNG, WEBP, atau GIF (otomatis dioptimasi).
            </p>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors pointer-events-none"
          >
            Pilih File
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
