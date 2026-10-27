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
  Award,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { getQuizById, getSubmissionsByQuizId, saveQuiz } from "@/lib/quizStore";
import { Quiz, Submission } from "@/lib/types";
import { sounds } from "@/lib/sound";

function QuizResultsContent() {
  const params = useParams();
  const quizId = typeof params.id === "string" ? params.id : "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchName, setSearchName] = useState<string>("");

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

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesClass = selectedClass === "ALL" || s.student_class === selectedClass;
    const matchesName = s.student_name.toLowerCase().includes(searchName.toLowerCase());
    return matchesClass && matchesName;
  });

  // Analytics calculations
  const totalStudents = filteredSubmissions.length;
  const averageScore = totalStudents > 0
    ? Math.round(filteredSubmissions.reduce((sum, s) => sum + s.score, 0) / totalStudents)
    : 0;
  const highestScore = totalStudents > 0
    ? Math.max(...filteredSubmissions.map((s) => s.score))
    : 0;
  const lowestScore = totalStudents > 0
    ? Math.min(...filteredSubmissions.map((s) => s.score))
    : 0;

  // Export to Excel function
  const handleExportExcel = () => {
    sounds.playSelect();
    if (filteredSubmissions.length === 0) {
      alert("Belum ada data pengerjaan murid untuk diekspor.");
      return;
    }

    const excelData = filteredSubmissions.map((sub, idx) => ({
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

    const colWidths = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 24 },
      { wch: 22 },
    ];
    worksheet["!cols"] = colWidths;

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
                <span>Review Murid: Tampil</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Review Murid: Sembunyi</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Cari nama murid..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-600">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-600 font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kelas ({submissions.length})</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Kelas {c} ({submissions.filter((s) => s.student_class === c).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Murid</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4 text-center">Nilai</th>
                <th className="py-3.5 px-4 text-center">Benar</th>
                <th className="py-3.5 px-4 text-center">Pindah Tab</th>
                <th className="py-3.5 px-4 text-center">Review Jawaban</th>
                <th className="py-3.5 px-4 text-right">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Belum ada data murid yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs">
                            🥇
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs">
                            🥈
                          </span>
                        ) : idx === 2 ? (
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
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playSelect();
                            setSelectedSubmission(sub);
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 text-xs">
                        {new Date(sub.completed_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  const studentAns = selectedSubmission.answers?.find(
                    (a) => a.question_id === q.id
                  );
                  const isCorrect = studentAns?.is_correct;
                  const selectedOpt = q.options.find(
                    (o) => o.id === studentAns?.selected_option_id
                  );
                  const correctOpt = q.options.find((o) => o.is_correct);

                  return (
                    <div
                      key={q.id}
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
                        <p className={isCorrect ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                          Jawaban Murid: {selectedOpt ? selectedOpt.option_text : "(Tidak dijawab / Kosong)"}
                        </p>
                        {!isCorrect && correctOpt && (
                          <p className="text-slate-600">
                            Kunci Jawaban Benar:{" "}
                            <strong className="text-slate-900 font-bold">{correctOpt.option_text}</strong>
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
