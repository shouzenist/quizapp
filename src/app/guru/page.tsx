"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Users,
  Award,
  Trash2,
  Edit3,
  BarChart2,
  QrCode,
  Copy,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Eye,
  EyeOff,
} from "lucide-react";
import { getAllQuizzes, deleteQuiz, saveQuiz, getSupabaseDiagnostic } from "@/lib/quizStore";
import { Quiz } from "@/lib/types";
import { sounds } from "@/lib/sound";
import QRCodeModal from "@/components/QRCodeModal";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRQuiz, setSelectedQRQuiz] = useState<Quiz | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [diag, setDiag] = useState<{
    isConfigured: boolean;
    connected: boolean;
    message: string;
    error?: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [data, diagnostic] = await Promise.all([
      getAllQuizzes(),
      getSupabaseDiagnostic(),
    ]);
    setQuizzes(data);
    setDiag(diagnostic);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime channel if configured
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel("quizzes-live-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quizzes" },
          () => {
            loadData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "submissions" },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kuis "${title}"?`)) return;
    sounds.playSelect();
    await deleteQuiz(id);
    await loadData();
  };

  const handleToggleActive = async (quiz: Quiz) => {
    sounds.playSelect();
    await saveQuiz({
      ...quiz,
      is_active: !quiz.is_active,
    });
    await loadData();
  };

  const handleToggleReview = async (quiz: Quiz) => {
    sounds.playSelect();
    const currentVal = quiz.show_answer_review !== false;
    await saveQuiz({
      ...quiz,
      show_answer_review: !currentVal,
    });
    await loadData();
  };

  const handleCopyCode = (quizCode: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/play/${quizCode}`);
    setCopiedId(id);
    sounds.playSelect();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalSubmissions = quizzes.reduce((sum, q) => sum + (q.submissions_count || 0), 0);
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 w-full flex-1">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dashboard Manajemen Guru</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Daftar Kuis Pembelajaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola soal, bagikan kode ke proyektor kelas, dan unduh rekap nilai murid dalam format Excel.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => {
              sounds.playSelect();
              loadData();
            }}
            disabled={loading}
            title="Segarkan Data"
            className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <Link
            href="/guru/quiz/new"
            onClick={() => sounds.playSelect()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 text-white font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kuis Baru</span>
          </Link>
        </div>
      </div>

      {/* Supabase Connection Status Card */}
      {diag && (
        <div
          className={`mb-8 p-4 md:p-5 rounded-2xl border text-xs md:text-sm transition-all ${
            diag.connected
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
              : diag.isConfigured
              ? "bg-amber-50/90 border-amber-300 text-amber-900"
              : "bg-blue-50/90 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {diag.connected ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}

              <div>
                <p className="font-bold flex items-center gap-2">
                  <span>{diag.connected ? "Database Supabase Aktif & Sinkron Real-Time" : "Status Koneksi Cloud"}</span>
                  {diag.connected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200/80 text-emerald-800 font-extrabold uppercase">
                      Live
                    </span>
                  )}
                </p>

                <p className="text-xs opacity-90 mt-0.5">
                  {diag.connected
                    ? "Perubahan yang Anda lakukan di PC atau HP akan langsung tersinkronisasi detik itu juga."
                    : diag.message}
                </p>

                {!diag.connected && diag.isConfigured && diag.error && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] font-mono text-amber-800">
                    <strong>Penyebab:</strong> {diag.error}
                    <p className="mt-1 font-sans text-slate-600">
                      👉 <em>Solusi:</em> Buka Supabase Dashboard -&gt; SQL Editor -&gt; Jalankan script file <code>supabase/schema.sql</code>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={loadData}
              className="text-xs font-bold underline hover:opacity-80 self-end sm:self-center"
            >
              Cek Ulang
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Total Kuis</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {quizzes.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Kuis yang telah dibuat</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Murid Mengerjakan</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalSubmissions}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total submission terkumpul</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Total Butir Soal</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalQuestions}
          </div>
          <p className="text-xs text-slate-400 mt-1">Butir soal terdaftar</p>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Semua Kuis</span>
          <span className="text-xs font-normal text-slate-400">({quizzes.length})</span>
        </h2>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Memuat data kuis...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Belum ada kuis</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Mulai buat kuis interaktif pertama Anda dan bagikan kodenya kepada murid!
            </p>
            <Link
              href="/guru/quiz/new"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 text-white text-xs font-semibold shadow-sm"
            >
              Buat Kuis Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {quiz.subject || "Umum"}
                    </span>
                    <button
                      onClick={() => handleToggleActive(quiz)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        quiz.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {quiz.is_active ? "● Aktif" : "○ Nonaktif"}
                    </button>

                    <button
                      onClick={() => handleToggleReview(quiz)}
                      title={
                        quiz.show_answer_review !== false
                          ? "Klik untuk sembunyikan review kunci jawaban dari murid"
                          : "Klik untuk tampilkan review kunci jawaban ke murid"
                      }
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        quiz.show_answer_review !== false
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {quiz.show_answer_review !== false ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Review: Tampil</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Review: Sembunyi</span>
                        </>
                      )}
                    </button>

                    {quiz.time_limit_minutes > 0 && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quiz.time_limit_minutes} Menit
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {quiz.description || "Tidak ada deskripsi"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      <strong className="text-slate-700 font-semibold">{quiz.questions?.length || 0}</strong> Soal
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">{quiz.submissions_count || 0}</strong> Murid Mengumpulkan
                    </span>
                  </div>
                </div>

                {/* Right Actions & Code */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Quiz Code Pill */}
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 font-medium px-1">KODE:</span>
                    <span className="font-mono font-bold text-sm text-blue-800 tracking-wider">
                      {quiz.quiz_code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(quiz.quiz_code, quiz.id)}
                      title="Salin Link Kuis"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-200/60 transition-colors ml-1 cursor-pointer"
                    >
                      {copiedId === quiz.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* QR Code Projector Modal Button */}
                  <button
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedQRQuiz(quiz);
                    }}
                    title="Tampilkan QR Code untuk Proyektor"
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-blue-700" />
                    <span className="sm:hidden">QR Proyektor</span>
                  </button>

                  {/* View Results / Leaderboard */}
                  <Link
                    href={`/guru/quiz/${quiz.id}/results`}
                    onClick={() => sounds.playSelect()}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Lihat Nilai</span>
                  </Link>

                  {/* Edit Quiz */}
                  <Link
                    href={`/guru/quiz/${quiz.id}/edit`}
                    onClick={() => sounds.playSelect()}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    title="Edit Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  {/* Delete Quiz */}
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                    title="Hapus Kuis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal for Classroom Projection */}
      {selectedQRQuiz && (
        <QRCodeModal
          isOpen={Boolean(selectedQRQuiz)}
          onClose={() => setSelectedQRQuiz(null)}
          quizCode={selectedQRQuiz.quiz_code}
          quizTitle={selectedQRQuiz.title}
        />
      )}
    </div>
  );
}
