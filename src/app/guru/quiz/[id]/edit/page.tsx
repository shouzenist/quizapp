"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  Clock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { getQuizById, saveQuiz } from "@/lib/quizStore";
import { Quiz, Question, Option } from "@/lib/types";
import { sounds } from "@/lib/sound";
import ImageUploader, { compressImage } from "@/components/ImageUploader";

function EditQuizContent() {
  const router = useRouter();
  const params = useParams();
  const quizId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [customClassInput, setCustomClassInput] = useState("");

  const handleAddClass = () => {
    const clean = customClassInput.trim();
    if (clean && !targetClasses.includes(clean)) {
      setTargetClasses([...targetClasses, clean]);
      setCustomClassInput("");
      sounds.playSelect();
    }
  };

  const handleRemoveClass = (cls: string) => {
    sounds.playSelect();
    setTargetClasses(targetClasses.filter((c) => c !== cls));
  };

  useEffect(() => {
    async function fetchQuiz() {
      if (!quizId) return;
      setLoading(true);
      const data = await getQuizById(quizId);
      if (!data) {
        setNotFound(true);
      } else {
        setTitle(data.title);
        setDescription(data.description || "");
        setSubject(data.subject || "Umum");
        setQuizCode(data.quiz_code);
        setTimeLimitMinutes(data.time_limit_minutes || 0);
        setIsActive(data.is_active);
        setQuestions(data.questions || []);
        setTargetClasses(data.target_classes || []);
      }
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId]);

  const handleAddQuestion = () => {
    sounds.playSelect();
    const newQId = "q-" + Date.now();
    setQuestions((prev) => [
      ...prev,
      {
        id: newQId,
        question_text: "",
        image_url: undefined,
        points: 20,
        order_index: prev.length,
        options: [
          { id: `opt-${newQId}-1`, option_text: "", is_correct: true },
          { id: `opt-${newQId}-2`, option_text: "", is_correct: false },
          { id: `opt-${newQId}-3`, option_text: "", is_correct: false },
          { id: `opt-${newQId}-4`, option_text: "", is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert("Kuis harus memiliki minimal 1 soal.");
      return;
    }
    sounds.playSelect();
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].question_text = text;
      return updated;
    });
  };

  const handleImageChange = (idx: number, imageUrl?: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].image_url = imageUrl;
      return updated;
    });
  };

  const handleTextareaPaste = async (e: React.ClipboardEvent, qIdx: number) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const dataUrl = await compressImage(file);
            handleImageChange(qIdx, dataUrl);
            sounds.playSelect();
          } catch {
            console.error("Gagal paste gambar");
          }
          return;
        }
      }
    }
  };

  const handlePointsChange = (idx: number, points: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].points = points;
      return updated;
    });
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options[optIdx].option_text = text;
      return updated;
    });
  };

  const handleSetCorrectOption = (qIdx: number, optIdx: number) => {
    sounds.playSelect();
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
        ...opt,
        is_correct: i === optIdx,
      }));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Judul kuis tidak boleh kosong.");
      sounds.playWrong();
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setErrorMsg(`Soal nomor ${i + 1} belum memiliki teks pertanyaan.`);
        sounds.playWrong();
        return;
      }
      const hasEmptyOpt = q.options.some((o) => !o.option_text.trim());
      if (hasEmptyOpt) {
        setErrorMsg(`Semua pilihan jawaban pada soal nomor ${i + 1} harus diisi.`);
        sounds.playWrong();
        return;
      }
      const hasCorrect = q.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        setErrorMsg(`Pilih minimal 1 kunci jawaban yang benar untuk soal nomor ${i + 1}.`);
        sounds.playWrong();
        return;
      }
    }

    setSaving(true);
    try {
      await saveQuiz({
        id: quizId,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        quiz_code: quizCode.trim().toUpperCase(),
        time_limit_minutes: Number(timeLimitMinutes) || 0,
        is_active: isActive,
        questions,
        target_classes: targetClasses,
      });

      sounds.playCorrect();
      router.push("/guru");
    } catch {
      setErrorMsg("Gagal memperbarui kuis.");
      sounds.playWrong();
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Memuat data kuis...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Kuis Tidak Ditemukan</h2>
        <Link href="/guru" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Kembali ke Dashboard Guru
        </Link>
      </div>
    );
  }

  const letters = ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 w-full flex-1">
      <div className="mb-6">
        <Link
          href="/guru"
          onClick={() => sounds.playSelect()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Guru</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Edit Kuis: {title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Ubah judul, opsi batas waktu, teks soal, atau pasang gambar pendukung.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Pengaturan Kuis</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Judul Kuis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Kode Masuk Kuis
              </label>
              <input
                type="text"
                maxLength={10}
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono font-bold text-sm text-indigo-700 uppercase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Deskripsi
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Batas Waktu (Menit)
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700">
                  {isActive ? "Kuis Aktif (Bisa Dikerjakan)" : "Kuis Nonaktif"}
                </span>
              </label>
            </div>

            {/* Target Kelas Murid */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pilihan Kelas untuk Murid
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Murid cukup mengklik salah satu kelas ini saat mau mulai kuis (mencegah salah ketik nama kelas).
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Template Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["7A", "7B", "7C", "7D"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 7 (7A-7D)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["8A", "8B", "8C", "8D"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 8
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["9A", "9B", "9C", "9D"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 9
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["10 MIPA 1", "10 MIPA 2", "10 IPS 1", "10 IPS 2"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMA 10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses([]);
                    }}
                    className="px-1.5 py-0.5 text-xs rounded-md text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Tag display & input */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
                  {targetClasses.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs"
                    >
                      <span>{cls}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer text-slate-400 font-bold"
                        title="Hapus Kelas"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {targetClasses.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      Belum ada kelas yang ditentukan (murid akan mengetik nama kelas secara bebas).
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="text"
                    value={customClassInput}
                    onChange={(e) => setCustomClassInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                    placeholder="Tambah kelas lain (misal: 7E atau XII TKJ 1) lalu tekan Enter..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Soal ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Soal</span>
            </button>
          </div>

          {questions.map((question, qIdx) => (
            <div
              key={question.id || qIdx}
              className="p-6 md:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-extrabold text-indigo-700">
                  Soal Nomor {qIdx + 1}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span>Poin:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={question.points || 10}
                      onChange={(e) => handlePointsChange(qIdx, Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Teks Pertanyaan <span className="text-[11px] font-normal text-slate-400">(Bisa tekan Ctrl+V di sini jika menyalin gambar)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={question.question_text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  onPaste={(e) => handleTextareaPaste(e, qIdx)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm font-medium"
                />
              </div>

              {/* Input Gambar Soal */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <ImageUploader
                  value={question.image_url}
                  onChange={(url) => handleImageChange(qIdx, url)}
                  label="Gambar / Diagram / Ilustrasi Soal"
                />
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pilihan Jawaban (Pilih Kunci Jawaban Benar)
                </label>

                {question.options.map((opt, optIdx) => {
                  const letter = letters[optIdx] || `${optIdx + 1}`;
                  return (
                    <div
                      key={opt.id || optIdx}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        opt.is_correct
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors flex-shrink-0 ${
                          opt.is_correct
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {opt.is_correct ? "✓" : letter}
                      </button>

                      <input
                        type="text"
                        required
                        value={opt.option_text}
                        onChange={(e) =>
                          handleOptionTextChange(qIdx, optIdx, e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-lg border-none focus:outline-none text-sm text-slate-800 bg-transparent font-medium"
                      />

                      {opt.is_correct && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                          Kunci Benar
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-between gap-4">
          <Link
            href="/guru"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Memperbarui..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Menyiapkan editor kuis...</p>
        </div>
      }
    >
      <EditQuizContent />
    </Suspense>
  );
}
