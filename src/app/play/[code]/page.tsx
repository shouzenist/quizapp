"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Trophy,
  RotateCcw,
  BookOpen,
  Send,
  HelpCircle,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import { getQuizByCode, submitQuizAnswers } from "@/lib/quizStore";
import { Quiz, Question, Option, StudentAnswer } from "@/lib/types";
import { sounds } from "@/lib/sound";

function PlayQuizContent() {
  const router = useRouter();
  const params = useParams();
  const quizCode = typeof params.code === "string" ? params.code.toUpperCase() : "";

  // Data states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Student info state
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [formError, setFormError] = useState("");

  // Quiz running states
  const [stage, setStage] = useState<"intro" | "playing" | "finished">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabSwitchWarning, setTabSwitchWarning] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<string>("");

  // Final submission result
  const [finalScore, setFinalScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [submittedAnswers, setSubmittedAnswers] = useState<StudentAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load quiz details
  useEffect(() => {
    async function loadQuiz() {
      if (!quizCode) return;
      setLoading(true);
      const data = await getQuizByCode(quizCode);
      if (!data) {
        setNotFound(true);
      } else {
        setQuiz(data);
        if (data.time_limit_minutes > 0) {
          setSecondsRemaining(data.time_limit_minutes * 60);
        }
      }
      setLoading(false);
    }
    loadQuiz();
  }, [quizCode]);

  // Anti-cheating: detect tab switch or window blur
  useEffect(() => {
    if (stage !== "playing") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setTabSwitchWarning(true);
        sounds.playWrong();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stage]);

  // Timer countdown
  useEffect(() => {
    if (stage !== "playing" || !quiz || quiz.time_limit_minutes === 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishQuiz();
          return 0;
        }
        if (prev <= 10) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, quiz]);

  const questions: Question[] = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Start the quiz
  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim()) {
      setFormError("Mohon lengkapi Nama Lengkap dan Kelas Anda.");
      sounds.playWrong();
      return;
    }
    setFormError("");
    setStartedAt(new Date().toISOString());
    setStage("playing");
    sounds.playSelect();
  };

  // Select an option
  const handleSelectOption = (questionId: string, optionId: string) => {
    sounds.playSelect();
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Keyboard navigation (A, B, C, D)
  useEffect(() => {
    if (stage !== "playing" || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, 1: 0, 2: 1, 3: 2, 4: 3 };

      if (key in optionMap) {
        const index = optionMap[key];
        if (currentQuestion.options[index]) {
          handleSelectOption(currentQuestion.id, currentQuestion.options[index].id);
        }
      } else if (key === "ARROWLEFT" && currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      } else if (key === "ARROWRIGHT" && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, currentQuestion, currentQuestionIndex, questions.length]);

  // Calculate score & Submit
  const handleFinishQuiz = async () => {
    if (!quiz || isSubmitting) return;
    setIsSubmitting(true);

    let calculatedScore = 0;
    let correct = 0;
    const recordedAnswers: StudentAnswer[] = [];

    questions.forEach((q) => {
      const selectedId = selectedAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.is_correct);
      const isCorrect = selectedId === correctOption?.id;

      if (isCorrect) {
        correct += 1;
        calculatedScore += q.points || 10;
      }

      recordedAnswers.push({
        question_id: q.id,
        selected_option_id: selectedId || "",
        is_correct: isCorrect,
      });
    });

    const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    const normalizedScore = totalPossiblePoints > 0 
      ? Math.round((calculatedScore / totalPossiblePoints) * 100)
      : 0;

    setFinalScore(normalizedScore);
    setCorrectCount(correct);
    setSubmittedAnswers(recordedAnswers);

    // Save to Database / Local Storage
    await submitQuizAnswers({
      quiz_id: quiz.id,
      student_name: studentName.trim(),
      student_class: studentClass.trim(),
      score: normalizedScore,
      total_questions: questions.length,
      correct_answers: correct,
      tab_switch_count: tabSwitchCount,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      answers: recordedAnswers,
    });

    setStage("finished");
    setIsSubmitting(false);

    // Trigger celebration
    sounds.playFinish();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat data kuis...</p>
      </div>
    );
  }

  // Quiz Not Found
  if (notFound || !quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Kuis Tidak Ditemukan</h2>
        <p className="text-slate-500 max-w-md mb-6">
          Kode kuis <strong className="text-slate-900 font-mono">{quizCode}</strong> tidak ditemukan atau kuis sudah dinonaktifkan oleh guru.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // STAGE 1: INTRO & STUDENT IDENTIFICATION
  if (stage === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 w-full flex-1 flex flex-col justify-center">
        <div className="glass-card rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {quiz.subject || "Umum"}
            </span>
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              KODE: {quiz.quiz_code}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="mt-2 text-slate-600 text-sm md:text-base leading-relaxed">
              {quiz.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Jumlah Soal</p>
                <p className="text-sm font-bold text-slate-800">{questions.length} Butir Soal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Batas Waktu</p>
                <p className="text-sm font-bold text-slate-800">
                  {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes} Menit` : "Santai (Tanpa Batas)"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleStartQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nama Lengkap Murid <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Muhammad Rizky Pratama"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>

              {quiz.target_classes && quiz.target_classes.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quiz.target_classes.map((c) => {
                      const isSelected = studentClass === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            sounds.playSelect();
                            setStudentClass(c);
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-200"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playSelect();
                        if (quiz.target_classes?.includes(studentClass)) {
                          setStudentClass("");
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium cursor-pointer underline mb-1.5 inline-block"
                    >
                      Bukan dari kelas di atas? Ketik manual di sini
                    </button>
                    {(!quiz.target_classes.includes(studentClass) || studentClass === "") && (
                      <input
                        type="text"
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="Ketik nama kelas Anda..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 text-sm font-medium bg-slate-50/50"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Contoh: 7A, 8B, atau 10 IPA 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-800 font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["7A", "7B", "8A", "8B", "9A", "10 IPA 1"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          sounds.playSelect();
                          setStudentClass(c);
                        }}
                        className={`px-2 py-0.5 rounded-md text-xs border transition-colors cursor-pointer ${
                          studentClass === c
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {formError && (
              <p className="text-xs text-rose-500 font-medium">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base cursor-pointer mt-4"
            >
              <span>Mulai Kerjakan Kuis Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STAGE 2: ACTIVE QUIZ IN PROGRESS
  if (stage === "playing") {
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const answeredCount = Object.keys(selectedAnswers).length;
    const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    const letters = ["A", "B", "C", "D", "E"];

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 w-full flex-1 flex flex-col justify-between">
        <div>
          {tabSwitchWarning && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs md:text-sm flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Perhatian!</strong> Anda terdeteksi berpindah tab ({tabSwitchCount}x). Tetap fokus pada kuis ya!
                </span>
              </div>
              <button
                onClick={() => setTabSwitchWarning(false)}
                className="text-xs font-bold text-amber-700 underline ml-2"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm md:text-base text-indigo-700">
                Soal {currentQuestionIndex + 1}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                dari {questions.length}
              </span>
            </div>

            {quiz.time_limit_minutes > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-mono font-bold border transition-colors ${
                  secondsRemaining < 60
                    ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="glass-card rounded-3xl p-6 md:p-8 shadow-lg border border-slate-200 bg-white my-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-4">
              <span>{quiz.title}</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                {currentQuestion.points || 10} Poin
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-lg md:text-2xl font-bold text-slate-900 leading-relaxed mb-4">
              {currentQuestion.question_text}
            </h2>

            {/* Question Image (if any) */}
            {currentQuestion.image_url && (
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50 shadow-sm max-h-80 max-w-full p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQuestion.image_url}
                    alt="Ilustrasi Soal"
                    className="max-h-72 w-auto object-contain rounded-xl hover:scale-[1.01] transition-transform"
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                const letter = letters[idx] || `${idx + 1}`;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer group ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {letter}
                    </div>

                    <span
                      className={`flex-1 text-sm md:text-base font-medium leading-snug ${
                        isSelected ? "text-indigo-950 font-bold" : "text-slate-800"
                      }`}
                    >
                      {option.option_text}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => {
              sounds.playSelect();
              setCurrentQuestionIndex((prev) => prev - 1);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs md:text-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Terjawab: {answeredCount} dari {questions.length}
          </div>

          {isLastQuestion ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishQuiz}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                setCurrentQuestionIndex((prev) => prev + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // STAGE 3: FINISHED & RESULTS
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 w-full flex-1 flex flex-col justify-center">
      <div className="glass-card rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 bg-white text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Kuis Selesai!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Terima kasih <strong className="text-slate-800">{studentName}</strong> ({studentClass}) sudah mengerjakan dengan baik.
        </p>

        <div className="my-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
            Nilai Akhir Kamu
          </span>
          <div className="text-5xl md:text-6xl font-black text-indigo-700 font-mono tracking-tight">
            {finalScore}
          </div>
          <p className="mt-2 text-xs md:text-sm font-semibold text-indigo-900">
            {finalScore >= 80
              ? "🌟 Luar Biasa! Hasil yang sangat membanggakan!"
              : finalScore >= 60
              ? "👍 Kerja Bagus! Pemahamanmu sudah cukup baik."
              : "💪 Tetap Semangat! Terus belajar dan latihan lagi ya!"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Benar</span>
            <span className="text-lg font-bold text-emerald-600">
              {correctCount} / {questions.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Akurasi</span>
            <span className="text-lg font-bold text-indigo-600">
              {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Pindah Tab</span>
            <span className={`text-lg font-bold ${tabSwitchCount > 0 ? "text-amber-600" : "text-slate-600"}`}>
              {tabSwitchCount}x
            </span>
          </div>
        </div>

        <div className="text-left mb-8 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Reviu Jawaban Soal</span>
          </h3>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const studentAns = submittedAnswers.find((a) => a.question_id === q.id);
              const isCorrect = studentAns?.is_correct;
              const selectedOpt = q.options.find((o) => o.id === studentAns?.selected_option_id);
              const correctOpt = q.options.find((o) => o.is_correct);

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border text-xs md:text-sm ${
                    isCorrect
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-rose-50/50 border-rose-200"
                  }`}
                >
                  <p className="font-semibold text-slate-800 mb-1.5">
                    {idx + 1}. {q.question_text}
                  </p>

                  {/* Review image thumbnail */}
                  {q.image_url && (
                    <div className="my-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.image_url}
                        alt="Gambar Soal"
                        className="max-h-28 rounded-lg border border-slate-200 object-contain bg-white"
                      />
                    </div>
                  )}

                  <div className="space-y-0.5 text-xs">
                    <p className={isCorrect ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                      Jawabanmu: {selectedOpt ? selectedOpt.option_text : "(Tidak dijawab)"} {isCorrect ? "✓" : "✗"}
                    </p>
                    {!isCorrect && correctOpt && (
                      <p className="text-slate-500">
                        Kunci Jawaban: <strong className="text-slate-700">{correctOpt.option_text}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              sounds.playSelect();
              setStage("intro");
              setSelectedAnswers({});
              setTabSwitchCount(0);
              setCurrentQuestionIndex(0);
            }}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs md:text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Kuis</span>
          </button>

          <Link
            href="/"
            onClick={() => sounds.playSelect()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Kembali ke Halaman Utama</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PlayQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Menyiapkan kuis...</p>
        </div>
      }
    >
      <PlayQuizContent />
    </Suspense>
  );
}
