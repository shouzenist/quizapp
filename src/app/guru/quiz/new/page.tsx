"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Save,
  Sparkles,
  Clock,
  Layers,
  Award,
} from "lucide-react";
import { saveQuiz } from "@/lib/quizStore";
import { Quiz, Question, Option } from "@/lib/types";
import { sounds } from "@/lib/sound";
import ImageUploader, { compressImage } from "@/components/ImageUploader";

function NewQuizContent() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quiz Meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("IPA");
  const [quizCode, setQuizCode] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [showAnswerReview, setShowAnswerReview] = useState(true);
  const [targetClasses, setTargetClasses] = useState<string[]>(["7A", "7B", "7C", "7D"]);
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

  // Initialize random code in useEffect to avoid hydration/prerender mismatch
  useEffect(() => {
    setQuizCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  // Global Defaults for Points & Option Counts
  const [defaultPoints, setDefaultPoints] = useState<number>(20);
  const [defaultOptionCount, setDefaultOptionCount] = useState<number>(4);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q-1",
      question_text: "",
      image_url: undefined,
      points: 20,
      order_index: 0,
      options: [
        { id: "opt-1", option_text: "", is_correct: true },
        { id: "opt-2", option_text: "", is_correct: false },
        { id: "opt-3", option_text: "", is_correct: false },
        { id: "opt-4", option_text: "", is_correct: false },
      ],
    },
  ]);

  // Load sample template for instant testing
  const handleLoadSample = () => {
    sounds.playSelect();
    setTitle("Kuis Sains & Penemuan Hebat");
    setDescription("Kuis seru seputar fakta sains, penemu, dan teknologi.");
    setSubject("IPA");
    setQuestions([
      {
        id: "q-sample-1",
        question_text: "Perhatikan gambar berikut. Siapakah tokoh penemu bola lampu pijar praktis pertama ini?",
        image_url: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=700&auto=format&fit=crop&q=80",
        points: 25,
        order_index: 0,
        options: [
          { id: "s-1-1", option_text: "Thomas Alva Edison", is_correct: true },
          { id: "s-1-2", option_text: "Nikola Tesla", is_correct: false },
          { id: "s-1-3", option_text: "Albert Einstein", is_correct: false },
          { id: "s-1-4", option_text: "Alexander Graham Bell", is_correct: false },
        ],
      },
      {
        id: "q-sample-2",
        question_text: "Zat cair yang biasa mengisi pipa termometer konvensional berikut adalah...",
        image_url: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=700&auto=format&fit=crop&q=80",
        points: 25,
        order_index: 1,
        options: [
          { id: "s-2-1", option_text: "Air raksa (Merkuri)", is_correct: true },
          { id: "s-2-2", option_text: "Minyak goreng", is_correct: false },
          { id: "s-2-3", option_text: "Bensin", is_correct: false },
          { id: "s-2-4", option_text: "Air mineral", is_correct: false },
        ],
      },
      {
        id: "q-sample-3",
        question_text: "Berapa jumlah pasang kromosom pada sel tubuh manusia normal?",
        points: 25,
        order_index: 2,
        options: [
          { id: "s-3-1", option_text: "23 pasang (46 buah)", is_correct: true },
          { id: "s-3-2", option_text: "20 pasang", is_correct: false },
          { id: "s-3-3", option_text: "46 pasang", is_correct: false },
          { id: "s-3-4", option_text: "12 pasang", is_correct: false },
        ],
      },
      {
        id: "q-sample-4",
        question_text: "Lapisan atmosfer bumi yang membakar sebagian besar meteor yang jatuh adalah...",
        points: 25,
        order_index: 3,
        options: [
          { id: "s-4-1", option_text: "Mesosfer", is_correct: true },
          { id: "s-4-2", option_text: "Troposfer", is_correct: false },
          { id: "s-4-3", option_text: "Stratosfer", is_correct: false },
          { id: "s-4-4", option_text: "Eksosfer", is_correct: false },
        ],
      },
    ]);
  };

  // Add a new blank question
  const handleAddQuestion = () => {
    sounds.playSelect();
    const newQId = "q-" + Date.now();
    const newOptions: Option[] = [];
    for (let i = 0; i < defaultOptionCount; i++) {
      newOptions.push({
        id: `opt-${newQId}-${i + 1}`,
        option_text: "",
        is_correct: i === 0,
      });
    }

    setQuestions((prev) => [
      ...prev,
      {
        id: newQId,
        question_text: "",
        image_url: undefined,
        points: defaultPoints,
        order_index: prev.length,
        options: newOptions,
      },
    ]);
  };

  // Remove question
  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert("Kuis harus memiliki minimal 1 soal.");
      return;
    }
    sounds.playSelect();
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update question text
  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].question_text = text;
      return updated;
    });
  };

  // Update question image
  const handleImageChange = (idx: number, imageUrl?: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].image_url = imageUrl;
      return updated;
    });
  };

  // Handle paste in question textarea (if user copies an image and presses Ctrl+V inside textarea)
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

  // Update question points
  const handlePointsChange = (idx: number, points: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].points = points;
      return updated;
    });
  };

  // Update option text
  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options[optIdx].option_text = text;
      return updated;
    });
  };

  // Set correct option
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

  // Apply default points to all questions
  const handleApplyDefaultPoints = (pts: number) => {
    const clean = Math.max(1, Math.min(100, pts || 1));
    setDefaultPoints(clean);
    sounds.playSelect();
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        points: clean,
      }))
    );
  };

  // Auto divide 100 points among all questions
  const handleAutoCalculatePoints = () => {
    if (questions.length === 0) return;
    sounds.playCorrect();
    const calculated = Math.max(1, Math.round(100 / questions.length));
    setDefaultPoints(calculated);
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        points: calculated,
      }))
    );
  };

  // Change default option count (3 to 5) and adjust all existing questions
  const handleApplyDefaultOptionCount = (count: number) => {
    if (count < 3 || count > 5) return;
    sounds.playSelect();
    setDefaultOptionCount(count);
    setQuestions((prev) =>
      prev.map((q) => {
        const curCount = q.options.length;
        if (curCount === count) return q;
        if (curCount > count) {
          const sliced = q.options.slice(0, count);
          if (!sliced.some((o) => o.is_correct)) {
            sliced[0].is_correct = true;
          }
          return { ...q, options: sliced };
        } else {
          const expanded = [...q.options];
          for (let i = curCount; i < count; i++) {
            expanded.push({
              id: `opt-${q.id}-${Date.now()}-${i + 1}`,
              option_text: "",
              is_correct: false,
            });
          }
          return { ...q, options: expanded };
        }
      })
    );
  };

  // Set option count (3, 4, or 5) for a specific question
  const handleSetQuestionOptionCount = (qIdx: number, targetCount: number) => {
    if (targetCount < 3 || targetCount > 5) return;
    sounds.playSelect();
    setQuestions((prev) => {
      const updated = [...prev];
      const q = updated[qIdx];
      const curCount = q.options.length;
      if (curCount === targetCount) return updated;

      if (curCount > targetCount) {
        const sliced = q.options.slice(0, targetCount);
        if (!sliced.some((o) => o.is_correct)) {
          sliced[0].is_correct = true;
        }
        updated[qIdx] = { ...q, options: sliced };
      } else {
        const expanded = [...q.options];
        for (let i = curCount; i < targetCount; i++) {
          expanded.push({
            id: `opt-${q.id}-${Date.now()}-${i + 1}`,
            option_text: "",
            is_correct: false,
          });
        }
        updated[qIdx] = { ...q, options: expanded };
      }
      return updated;
    });
  };

  // Add 1 option to a specific question (max 5)
  const handleAddOptionToQuestion = (qIdx: number) => {
    const q = questions[qIdx];
    if (q.options.length >= 5) return;
    sounds.playSelect();
    const nextIdx = q.options.length;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options = [
        ...updated[qIdx].options,
        {
          id: `opt-${q.id}-${Date.now()}-${nextIdx + 1}`,
          option_text: "",
          is_correct: false,
        },
      ];
      return updated;
    });
  };

  // Remove 1 option from a specific question (min 3)
  const handleRemoveOptionFromQuestion = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    if (q.options.length <= 3) return;
    sounds.playSelect();
    setQuestions((prev) => {
      const updated = [...prev];
      const filtered = updated[qIdx].options.filter((_, i) => i !== optIdx);
      if (!filtered.some((o) => o.is_correct) && filtered.length > 0) {
        filtered[0].is_correct = true;
      }
      updated[qIdx].options = filtered;
      return updated;
    });
  };

  // Save Quiz
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
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        quiz_code: quizCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase(),
        time_limit_minutes: Number(timeLimitMinutes) || 0,
        is_active: isActive,
        show_answer_review: showAnswerReview,
        target_classes: targetClasses,
        questions,
      });

      sounds.playCorrect();
      router.push("/guru");
    } catch {
      setErrorMsg("Gagal menyimpan kuis. Silakan coba lagi.");
      sounds.playWrong();
      setSaving(false);
    }
  };

  const letters = ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 w-full flex-1">
      <div className="mb-6">
        <Link
          href="/guru"
          onClick={() => sounds.playSelect()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Guru</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Buat Kuis Baru
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Isi detail kuis dan susun butir pertanyaan (bisa upload atau paste gambar langsung).
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-700" />
          <span>Muat Contoh Soal Gambar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Informasi Umum Kuis</span>
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
                placeholder="Contoh: Penilaian Harian IPA Kelas 7 - Ekosistem"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium"
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
                placeholder="Contoh: Matematika, IPA, Bahasa Indonesia"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Kode Masuk Kuis (6 Digit)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono font-bold text-sm text-blue-800 uppercase"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuizCode(Math.random().toString(36).substring(2, 8).toUpperCase())
                  }
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors whitespace-nowrap"
                >
                  Acak
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Deskripsi / Petunjuk Pengerjaan
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan petunjuk untuk murid, misalnya: Perhatikan gambar pada setiap soal sebelum memilih jawaban."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Batas Waktu (Menit)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  (0 = Santai / Tanpa Batas)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-6 md:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700">
                  {isActive ? "Kuis Aktif (Bisa Dikerjakan)" : "Kuis Nonaktif"}
                </span>
              </label>

              <label
                className="relative inline-flex items-center cursor-pointer select-none"
                title={
                  showAnswerReview
                    ? "Siswa dapat melihat kunci jawaban & pembahasan setelah selesai."
                    : "Kunci jawaban dirahasiakan dari siswa (demi keamanan ujian)."
                }
              >
                <input
                  type="checkbox"
                  checked={showAnswerReview}
                  onChange={(e) => setShowAnswerReview(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700">
                  {showAnswerReview ? "Tampilkan Review Jawaban" : "Sembunyikan Review Jawaban"}
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
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 7 (7A-7D)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["8A", "8B", "8C", "8D"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 8
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["9A", "9B", "9C", "9D"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    SMP 9
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setTargetClasses(["10 MIPA 1", "10 MIPA 2", "10 IPS 1", "10 IPS 2"]);
                    }}
                    className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors font-medium cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-blue-200 text-blue-700 text-xs font-bold shadow-xs"
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
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Soal</span>
            </button>
          </div>

          {/* Quick Global Defaults Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/60 to-slate-50 border border-blue-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Default Poin */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-700" />
                <span>Poin per Soal:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {[10, 20, 25].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => handleApplyDefaultPoints(pts)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      defaultPoints === pts
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {pts} Pts
                  </button>
                ))}

                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={defaultPoints}
                    onChange={(e) => handleApplyDefaultPoints(Number(e.target.value))}
                    className="w-12 text-center font-bold text-xs text-blue-800 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 font-medium">Poin</span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoCalculatePoints}
                  title="Otomatis bagi 100 poin secara merata untuk seluruh soal"
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Bagi Rata (Total 100 Poin)</span>
                </button>
              </div>
            </div>

            {/* Default Pilihan Ganda (3-5 Opsi) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-blue-100">
              <span className="text-xs font-bold text-slate-700">
                Pilihan Ganda:
              </span>
              <div className="flex items-center gap-1.5">
                {[3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleApplyDefaultOptionCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      defaultOptionCount === cnt
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {cnt} Opsi ({cnt === 3 ? "A-C" : cnt === 4 ? "A-D" : "A-E"})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {questions.map((question, qIdx) => (
            <div
              key={question.id}
              className="p-6 md:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-extrabold text-blue-800">
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
                      className="w-14 px-2 py-1 text-center font-bold text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teks Pertanyaan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Teks Pertanyaan <span className="text-[11px] font-normal text-slate-400">(Bisa langsung tekan Ctrl+V di sini jika menyalin gambar)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={question.question_text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  onPaste={(e) => handleTextareaPaste(e, qIdx)}
                  placeholder="Tuliskan pertanyaan di sini... Anda juga bisa paste gambar screenshot langsung dengan Ctrl+V."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium"
                />
              </div>

              {/* Input Gambar Soal (Upload / Paste / Link) */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <ImageUploader
                  value={question.image_url}
                  onChange={(url) => handleImageChange(qIdx, url)}
                  label="Gambar / Diagram / Ilustrasi Soal"
                />
              </div>

              {/* Pilihan Jawaban */}
              <div className="space-y-2.5 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilihan Jawaban (Tentukan Kunci Jawaban Benar)
                  </label>

                  {/* Per-question Option count chips (3, 4, 5) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Jumlah:</span>
                    {[3, 4, 5].map((cnt) => {
                      const isActive = question.options.length === cnt;
                      return (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleSetQuestionOptionCount(qIdx, cnt)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {cnt} ({cnt === 3 ? "A-C" : cnt === 4 ? "A-D" : "A-E"})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {question.options.map((opt, optIdx) => {
                  const letter = letters[optIdx] || `${optIdx + 1}`;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        opt.is_correct
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                        title={opt.is_correct ? "Kunci Jawaban Benar" : "Jadikan Kunci Jawaban"}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
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
                        placeholder={`Pilihan ${letter}...`}
                        className="w-full px-3 py-1.5 rounded-lg border-none focus:outline-none text-sm text-slate-800 bg-transparent font-medium"
                      />

                      {opt.is_correct && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                          Kunci Benar
                        </span>
                      )}

                      {question.options.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionFromQuestion(qIdx, optIdx)}
                          title={`Hapus Pilihan ${letter}`}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {question.options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => handleAddOptionToQuestion(qIdx)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pilihan ({letters[question.options.length]})</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl text-slate-500 hover:text-blue-700 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Butir Soal Baru</span>
          </button>
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 text-white font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Menyimpan..." : "Simpan & Terbitkan Kuis"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Menyiapkan form kuis baru...</p>
        </div>
      }
    >
      <NewQuizContent />
    </Suspense>
  );
}
