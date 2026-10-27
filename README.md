# 🚀 QuizPintar - Platform Kuis Interaktif Guru & Murid

Aplikasi kuis interaktif modern yang dirancang khusus untuk pembelajaran sekolah dengan sistem **Zero-Friction bagi murid** (cukup masukkan Nama & Kelas tanpa perlu login atau registrasi). Aplikasi ini siap dideploy ke **Vercel** dengan database **Supabase**.

---

## ✨ Fitur Utama

### 🎒 Sisi Murid (Zero-Friction)
1. **Tanpa Akun / Login**: Murid cukup memasukkan kode kuis 6 digit (misal: `PINTAR`) atau membuka link langsung, lalu menginput **Nama Lengkap** dan **Kelas**.
2. **Pengalaman Mengerjakan Responsif**:
   - Tampilan bersih & nyaman diakses dari smartphone maupun laptop.
   - Pilihan ganda interaktif dengan efek suara (Web Audio API) & navigasi keyboard (A/B/C/D).
   - Timer hitung mundur otomatis dengan peringatan visual.
   - Fitur **Anti-Curang Sederhana**: mendeteksi jika murid berpindah tab browser saat kuis berlangsung.
3. **Hasil & Reviu Instan**:
   - Animasi konfeti perayaan saat selesai.
   - Kartu nilai akhir, skor akurasi, dan jumlah benar/salah.
   - Reviu pembahasan jawaban soal.

### 👩‍🏫 Sisi Guru (Portal Guru)
1. **Dashboard Manajemen Kuis** (`/guru`):
   - Ringkasan statistik (Total Kuis, Total Murid yang Mengumpulkan, Total Butir Soal).
   - Aktifkan / Nonaktifkan kuis dalam 1 klik.
2. **Pembuat Kuis Cepat** (`/guru/quiz/new` & edit):
   - Atur Judul, Mata Pelajaran, Kode Kuis kustom, dan Batas Waktu.
   - Tombol **"Muat Contoh Soal Cepat"** untuk testing instan.
   - Pemilihan kunci jawaban & pembobotan poin per butir soal.
3. **Proyektor Kelas (QR Code & PIN)**:
   - Tampilkan QR Code besar ke layar proyektor/TV kelas. Murid cukup scan kamera HP untuk langsung masuk.
4. **Rekap Hasil & Export Excel** (`/guru/quiz/[id]/results`):
   - Papan peringkat nilai murid real-time dengan medali (🥇, 🥈, 🥉).
   - Filter berdasarkan kelas (misal: hanya kelas 7A, 7B, dsb.).
   - Tombol **"Download Excel (.xlsx)"** yang menghasilkan file rekapitulasi lengkap siap pakai untuk buku nilai guru atau e-Rapor.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Audio Feedback**: Web Audio API Synthesizer (tanpa butuh asset audio eksternal)
- **Animasi & Efek**: Canvas Confetti
- **Exporting**: SheetJS (XLSX)

---

## ⚡ Cara Menjalankan Secara Lokal

Aplikasi sudah memiliki built-in **Demo Data Fallback**, sehingga dapat langsung dites di browser tanpa perlu setup Supabase terlebih dahulu!

1. Jalankan development server:
   ```bash
   npm run dev
   ```
2. Buka di peramban: [http://localhost:3000](http://localhost:3000)
3. Coba kuis yang sudah tersedia:
   - Kode Kuis Umum: `PINTAR`
   - Kode Kuis Matematika: `JUARA1`
4. Masuk ke **Portal Guru** melalui menu kanan atas (`/guru`).

---

## 🗄️ Menghubungkan ke Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com).
2. Masuk ke menu **SQL Editor** di Supabase.
3. Buka file [`supabase/schema.sql`](./supabase/schema.sql) pada project ini, salin seluruh kodenya, lalu klik **Run** di SQL Editor Supabase.
4. Masuk ke **Project Settings** -> **API** di Supabase, lalu salin:
   - **Project URL**
   - **anon public key**
5. Buat file `.env.local` di folder root project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Aplikasi akan otomatis beralih menggunakan PostgreSQL Supabase!

---

## 🚀 Deploy ke Vercel (1-Click)

1. Upload / Push repositori ini ke GitHub / GitLab.
2. Buka [Vercel Dashboard](https://vercel.com/new) dan klik **Import** repositori ini.
3. Pada bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**! Kuis Anda akan langsung online dan bisa diakses oleh seluruh murid sekolah.
