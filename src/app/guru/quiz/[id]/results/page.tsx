"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Download,
  Users,
  Trophy,
  Filter,
  BarChart2,
  Clock,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Award,
  Eye,
  EyeOff,
  X,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  getQuizById,
  getSubmissionsByQuizId,
  saveQuiz,
  deleteSubmission,
  clearQuizSubmissions,
  recalculateQuizSubmissions,
} from "@/lib/quizStore";
import { Quiz, Submission } from "@/lib/types";
import { sounds } from "@/lib/sound";

type SortField = "nilai" | "nama" | "kelas" | "waktu";
type SortOrder = "asc" | "desc";

function QuizResultsContent() {
  const params = useParams();
  const quizId = typeof params.id === "string" ? params.id : "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Filters & Sorting
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchName, setSearchName] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("nilai");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Actions states
  const [isResyncing, setIsResyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggleReview = async () => {
    if (!quiz) return;
    sounds.playSelect();
    const currentVal = quiz.show_answer_review !== false;
    const updated = await saveQuiz({
      ...quiz,
      show_answer_review: !currentVal,
    });
    setQuiz(updated);
  };

  useEffect(() => {
    async function loadData() {
      if (!quizId) return;
      setLoading(true);
      const [qData, subData] = await Promise.all([
        getQuizById(quizId),
        getSubmissionsByQuizId(quizId),
      ]);
      setQuiz(qData);
      setSubmissions(subData);
      setLoading(false);
    }
    loadData();
  }, [quizId]);

  // Extract unique classes
  const classes = Array.from(new Set(submissions.map((s) => s.student_class))).filter(Boolean);

  // Filter & Sort submissions
  const filteredAndSortedSubmissions = submissions
    .filter((s) => {
      const matchesClass = selectedClass === "ALL" || s.student_class === selectedClass;
      const matchesName = s.student_name.toLowerCase().includes(searchName.toLowerCase());
      return matchesClass && matchesName;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "nilai") {
        comparison = a.score - b.score;
      } else if (sortField === "nama") {
        comparison = a.student_name.localeCompare(b.student_name, "id");
      } else if (sortField === "kelas") {
        comparison = a.student_class.localeCompare(b.student_class, "id");
      } else if (sortField === "waktu") {
        comparison = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleHeaderSort = (field: SortField) => {
    sounds.playSelect();
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "nama" || field === "kelas" ? "asc" : "desc");
    }
  };

  // Sinkronisasi Ulang / Penilaian Ulang
  const handleRecalculate = async () => {
    if (!quizId) return;
    sounds.playSelect();
    setIsResyncing(true);
    setNotification(null);
    try {
      const res = await recalculateQuizSubmissions(quizId);
      if (res.success) {
        sounds.playCorrect();
        setSubmissions(res.submissions);
        setNotification({ type: "success", text: res.message });
      } else {
        sounds.playWrong();
        setNotification({ type: "error", text: res.message });
      }
    } catch {
      sounds.playWrong();
      setNotification({ type: "error", text: "Terjadi kesalahan saat menyinkronkan ulang nilai." });
    } finally {
      setIsResyncing(false);
    }
  };

  // Hapus single submission
  const handleConfirmDelete = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteSubmission(submissionToDelete.id, quizId);
      if (ok) {
        sounds.playCorrect();
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionToDelete.id));
        setNotification({
          type: "success",
          text: `Data nilai murid "${submissionToDelete.student_name}" berhasil dihapus.`,
        });
      }
    } catch {
      sounds.playWrong();
      setNotification({ type: "error", text: "Gagal menghapus data nilai." });
    } finally {
      setIsDeleting(false);
      setSubmissionToDelete(null);
    }
  };

  // Reset semua submissions
  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearQuizSubmissions(quizId);
      sounds.playCorrect();
      setSubmissions([]);
      setNotification({
        type: "success",
        text: "Semua data nilai dan riwayat pengerjaan murid telah dibersihkan.",
      });
    } catch {
      sounds.playWrong();
      setNotification({ type: "error", text: "Gagal membersihkan data nilai." });
    } finally {
      setIsDeleting(false);
      setShowClearAllModal(false);
    }
  };

  // Analytics calculations based on current filtered items
  const totalStudents = filteredAndSortedSubmissions.length;
  const averageScore = totalStudents > 0
    ? Math.round(filteredAndSortedSubmissions.reduce((sum, s) => sum + s.score, 0) / totalStudents)
    : 0;
  const highestScore = totalStudents > 0
    ? Math.max(...filteredAndSortedSubmissions.map((s) => s.score))
    : 0;
  const lowestScore = totalStudents > 0
    ? Math.min(...filteredAndSortedSubmissions.map((s) => s.score))
    : 0;

  // Export to Excel function
  const handleExportExcel = () => {
    sounds.playSelect();
    if (filteredAndSortedSubmissions.length === 0) {
      alert("Belum ada data pengerjaan murid untuk diekspor.");
      return;
    }

    const excelData = filteredAndSortedSubmissions.map((sub, idx) => ({
      No: idx + 1,
      "Nama Murid": sub.student_name,
      Kelas: sub.student_class,
      "Nilai Akhir": sub.score,
      "Jawaban Benar": sub.correct_answers,
      "Total Soal": sub.total_questions,
      "Pindah Tab (Anti-Curang)": `${sub.tab_switch_count}x`,
      "Waktu Selesai": new Date(sub.completed_at).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 24 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");

    const safeTitle = (quiz?.title || "Kuis").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(workbook, `Rekap_Nilai_${safeTitle}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Memuat rekap hasil kuis...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 w-full flex-1">
      {/* Top back & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          href="/guru"
          onClick={() => sounds.playSelect()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Guru</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Sinkronkan Ulang Button */}
          <button
            onClick={handleRecalculate}
            disabled={isResyncing}
            title="Hitung ulang seluruh nilai murid berdasarkan kunci jawaban kuis terbaru"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isResyncing ? "animate-spin" : ""}`} />
            <span>{isResyncing ? "Menyinkronkan..." : "Sinkronkan Ulang Nilai"}</span>
          </button>

          {/* Review Murid Toggle */}
          <button
            onClick={handleToggleReview}
            title="Atur apakah murid boleh melihat review jawaban setelah kuis selesai"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer ${
              quiz?.show_answer_review !== false
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            {quiz?.show_answer_review !== false ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Review: Tampil</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Review: Sembunyi</span>
              </>
            )}
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Reset / Hapus Semua Testing Data */}
          {submissions.length > 0 && (
            <button
              onClick={() => {
                sounds.playSelect();
                setShowClearAllModal(true);
              }}
              title="Bersihkan seluruh data hasil untuk reset testing"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Hasil</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl mb-6 text-xs md:text-sm font-medium flex items-center justify-between border animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quiz Header Title */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {quiz?.subject || "Umum"}
          </span>
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            KODE: {quiz?.quiz_code}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Rekap Nilai: {quiz?.title}
        </h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">
          Pantau capaian belajar murid, peringkat skor, serta analisis integritas pengerjaan.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Total Murid
          </p>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalStudents}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mengumpulkan jawaban</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Rata-rata Nilai
          </p>
          <div className="text-3xl font-black text-indigo-600 font-mono">
            {averageScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dari skala 100</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Nilai Tertinggi
          </p>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {highestScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Skor puncak kelas</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Nilai Terendah
          </p>
          <div className="text-3xl font-black text-rose-500 font-mono">
            {lowestScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Perlu bimbingan</p>
        </div>
      </div>

      {/* Filter and Search & Sorting Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Cari nama murid..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filter Kelas & Sorting Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-600 font-medium text-slate-700"
            >
              <option value="ALL">Semua Kelas ({submissions.length})</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  Kelas {c} ({submissions.filter((s) => s.student_class === c).length})
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split("-") as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
              }}
              className="w-full px-2.5 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-600 font-semibold text-slate-700"
            >
              <option value="nilai-desc">Nilai Tertinggi (Peringkat)</option>
              <option value="nilai-asc">Nilai Terendah</option>
              <option value="nama-asc">Nama Murid (A - Z)</option>
              <option value="nama-desc">Nama Murid (Z - A)</option>
              <option value="kelas-asc">Kelas (A - Z)</option>
              <option value="waktu-desc">Waktu Selesai (Terbaru)</option>
              <option value="waktu-asc">Waktu Selesai (Terlama)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                
                {/* Sortable Header: Nama Murid */}
                <th
                  onClick={() => handleHeaderSort("nama")}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none group"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Murid</span>
                    {sortField === "nama" ? (
                      sortOrder === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>

                {/* Sortable Header: Kelas */}
                <th
                  onClick={() => handleHeaderSort("kelas")}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none group"
                >
                  <div className="flex items-center gap-1">
                    <span>Kelas</span>
                    {sortField === "kelas" ? (
                      sortOrder === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>

                {/* Sortable Header: Nilai */}
                <th
                  onClick={() => handleHeaderSort("nilai")}
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 select-none group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Nilai</span>
                    {sortField === "nilai" ? (
                      sortOrder === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Benar</th>
                <th className="py-3.5 px-4 text-center">Pindah Tab</th>

                {/* Sortable Header: Waktu Selesai */}
                <th
                  onClick={() => handleHeaderSort("waktu")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 select-none group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Waktu Selesai</span>
                    {sortField === "waktu" ? (
                      sortOrder === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Belum ada data murid yang sesuai filter atau data pengerjaan kuis masih kosong.
                  </td>
                </tr>
              ) : (
                filteredAndSortedSubmissions.map((sub, idx) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {sortField === "nilai" && sortOrder === "desc" && idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs">
                            🥇
                          </span>
                        ) : sortField === "nilai" && sortOrder === "desc" && idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs">
                            🥈
                          </span>
                        ) : sortField === "nilai" && sortOrder === "desc" && idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs">
                            🥉
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {sub.student_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {sub.student_class}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black font-mono text-base">
                        <span
                          className={
                            sub.score >= 80
                              ? "text-emerald-600"
                              : sub.score >= 60
                              ? "text-indigo-600"
                              : "text-rose-500"
                          }
                        >
                          {sub.score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {sub.correct_answers} / {sub.total_questions}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sub.tab_switch_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <ShieldAlert className="w-3 h-3" />
                            {sub.tab_switch_count}x
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 text-xs font-mono">
                        {new Date(sub.completed_at).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Review Jawaban */}
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playSelect();
                              setSelectedSubmission(sub);
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Lihat lembar jawaban murid"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>

                          {/* Tombol Hapus Hasil Testing */}
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playSelect();
                              setSubmissionToDelete(sub);
                            }}
                            className="p-1.5 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold border border-rose-200 transition-colors cursor-pointer inline-flex items-center"
                            title="Hapus data nilai ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus 1 Murid */}
      {submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Hapus Nilai Murid?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus data nilai <strong>{submissionToDelete.student_name}</strong> (Kelas {submissionToDelete.student_class})? Tindakan ini cocok untuk membersihkan data testing.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubmissionToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Semua Hasil */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset / Bersihkan Semua Nilai?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Tindakan ini akan menghapus seluruh data nilai (<strong>{submissions.length} lembar pengerjaan</strong>) pada kuis ini. Cocok untuk membersihkan data testing sebelum kuis dibagikan ke murid yang sebenarnya.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? "Membersihkan..." : "Ya, Bersihkan Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Review Jawaban Siswa untuk Guru */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Review Lembar Jawaban Siswa
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 mt-1">
                  {selectedSubmission.student_name}{" "}
                  <span className="text-slate-400 font-normal">({selectedSubmission.student_class})</span>
                </h3>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary in Modal */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50/40 border-b border-slate-100 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Nilai Akhir</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  {selectedSubmission.score}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Benar / Total</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">
                  {selectedSubmission.correct_answers} / {selectedSubmission.total_questions}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Pindah Tab</span>
                <span className="text-xl font-bold text-slate-700 font-mono">
                  {selectedSubmission.tab_switch_count}x
                </span>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4">
              {quiz?.questions && quiz.questions.length > 0 ? (
                quiz.questions.map((q, idx) => {
                  // Fallback matching: by question_id -> question_index -> array index
                  const studentAns =
                    selectedSubmission.answers?.find((a) => a.question_id === q.id) ||
                    selectedSubmission.answers?.find((a) => a.question_index === idx) ||
                    selectedSubmission.answers?.[idx];

                  const isCorrect = studentAns?.is_correct;

                  // Fallback option matching: by option id -> option text -> option index
                  const selectedOpt =
                    q.options.find((o) => o.id === studentAns?.selected_option_id) ||
                    q.options.find(
                      (o) =>
                        o.option_text.trim().toLowerCase() ===
                        studentAns?.selected_option_text?.trim().toLowerCase()
                    ) ||
                    (studentAns?.selected_option_index !== undefined
                      ? q.options[studentAns.selected_option_index]
                      : undefined);

                  const correctOpt = q.options.find((o) => o.is_correct);

                  const answerDisplay = selectedOpt
                    ? selectedOpt.option_text
                    : studentAns?.selected_option_text
                    ? studentAns.selected_option_text
                    : isCorrect
                    ? "(Jawaban Benar Tercatat di Database)"
                    : "(Tidak dijawab / Kosong)";

                  return (
                    <div
                      key={q.id || `q-${idx}`}
                      className={`p-4 rounded-2xl border text-xs md:text-sm ${
                        isCorrect
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-rose-50/40 border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {q.question_text}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isCorrect ? "✓ Benar" : "✗ Salah"}
                        </span>
                      </div>

                      {q.image_url && (
                        <div className="my-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.image_url}
                            alt="Ilustrasi Soal"
                            className="max-h-32 rounded-xl border border-slate-200 object-contain bg-white"
                          />
                        </div>
                      )}

                      <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/60 text-xs">
                        <p
                          className={
                            isCorrect
                              ? "text-emerald-700 font-semibold"
                              : "text-rose-700 font-semibold"
                          }
                        >
                          Jawaban Murid: {answerDisplay}
                        </p>
                        {!isCorrect && correctOpt && (
                          <p className="text-slate-600">
                            Kunci Jawaban Benar:{" "}
                            <strong className="text-slate-900 font-bold">
                              {correctOpt.option_text}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">
                  Detail butir pertanyaan tidak tersedia.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Menyiapkan rekap nilai...</p>
        </div>
      }
    >
      <QuizResultsContent />
    </Suspense>
  );
}
