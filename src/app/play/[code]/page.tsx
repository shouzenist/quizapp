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
  EyeOff,
  Puzzle,
  Maximize2,
  X,
} from "lucide-react";
import { getQuizByCode, submitQuizAnswers, resolveQuizType } from "@/lib/quizStore";
import { Quiz, Question, Option, StudentAnswer } from "@/lib/types";
import { sounds } from "@/lib/sound";

interface MatchUpCard {
  id: string;
  text: string;
  sourceQuestionId: string;
}

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

  // Match-Up Specific States
  const [matchCards, setMatchCards] = useState<MatchUpCard[]>([]);
  const [matchedSlots, setMatchedSlots] = useState<Record<string, string | null>>({}); // questionId -> cardId
  const [activeTextCardId, setActiveTextCardId] = useState<string | null>(null);
  const [activeSlotQId, setActiveSlotQId] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

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
  const isMatchUp = resolveQuizType(quiz) === "match_up";
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

    // Initialize Match-Up cards if match_up quiz
    if (isMatchUp && quiz?.questions) {
      const cards: MatchUpCard[] = quiz.questions.map((q, idx) => ({
        id: `card-${q.id || idx}`,
        text: (q.question_text || q.options?.[0]?.option_text || "").trim(),
        sourceQuestionId: q.id,
      }));
      // Shuffled text choices for students
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setMatchCards(shuffled);
      setMatchedSlots({});
      setActiveTextCardId(null);
      setActiveSlotQId(null);
    }

    setStage("playing");
    sounds.playSelect();
  };

  // Match-Up Handlers
  const handleSelectTextCard = (cardId: string) => {
    sounds.playSelect();
    // If a slot is waiting for placement
    if (activeSlotQId) {
      setMatchedSlots((prev) => {
        const next = { ...prev };
        // Detach card from previous slot if placed elsewhere
        for (const [qId, cId] of Object.entries(next)) {
          if (cId === cardId) {
            next[qId] = null;
          }
        }
        next[activeSlotQId] = cardId;
        return next;
      });
      setActiveSlotQId(null);
      setActiveTextCardId(null);
      return;
    }

    // Toggle active card
    if (activeTextCardId === cardId) {
      setActiveTextCardId(null);
    } else {
      setActiveTextCardId(cardId);
    }
  };

  const handleSelectSlot = (qId: string) => {
    sounds.playSelect();
    // If a text card was selected
    if (activeTextCardId) {
      setMatchedSlots((prev) => {
        const next = { ...prev };
        for (const [key, cId] of Object.entries(next)) {
          if (cId === activeTextCardId) {
            next[key] = null;
          }
        }
        next[qId] = activeTextCardId;
        return next;
      });
      setActiveTextCardId(null);
      setActiveSlotQId(null);
      return;
    }

    // Toggle active slot
    if (activeSlotQId === qId) {
      setActiveSlotQId(null);
    } else {
      setActiveSlotQId(qId);
    }
  };

  const handleDetachSlot = (qId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playSelect();
    setMatchedSlots((prev) => ({
      ...prev,
      [qId]: null,
    }));
    if (activeSlotQId === qId) {
      setActiveSlotQId(null);
    }
  };

  const handleResetAllMatches = () => {
    sounds.playSelect();
    setMatchedSlots({});
    setActiveTextCardId(null);
    setActiveSlotQId(null);
  };

  // Submit Match-Up answers
  const handleFinishMatchUp = async () => {
    if (!quiz || isSubmitting) return;

    const unplacedCount = questions.filter((q) => !matchedSlots[q.id]).length;
    if (unplacedCount > 0) {
      const confirmSubmit = window.confirm(
        `Masih ada ${unplacedCount} gambar yang belum dipasangkan dengan tulisan. Yakin ingin mengumpulkan jawaban sekarang?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    let calculatedScore = 0;
    let correct = 0;
    const recordedAnswers: StudentAnswer[] = [];

    questions.forEach((q, idx) => {
      const cardId = matchedSlots[q.id];
      const card = matchCards.find((c) => c.id === cardId);
      const placedText = card ? card.text.trim() : "";
      const correctText = (q.question_text || q.options?.[0]?.option_text || "").trim();
      const isCorrect = placedText.toLowerCase() === correctText.toLowerCase() && placedText !== "";

      if (isCorrect) {
        correct += 1;
        calculatedScore += q.points || 10;
      }

      recordedAnswers.push({
        question_id: q.id,
        question_index: idx,
        question_text: correctText,
        image_url: q.image_url,
        selected_option_id: cardId || "",
        selected_option_text: placedText || "(Belum Dipasangkan)",
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

    sounds.playFinish();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Select an option (Multiple Choice)
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
      const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

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

  // Calculate score & Submit (Multiple Choice)
  const handleFinishQuiz = async () => {
    if (!quiz || isSubmitting) return;
    if (isMatchUp) {
      return handleFinishMatchUp();
    }
    setIsSubmitting(true);

    let calculatedScore = 0;
    let correct = 0;
    const recordedAnswers: StudentAnswer[] = [];

    questions.forEach((q, idx) => {
      const selectedId = selectedAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.is_correct);
      const isCorrect = selectedId === correctOption?.id;
      const selectedOption = q.options.find((opt) => opt.id === selectedId);
      const selectedOptIdx = q.options.findIndex((opt) => opt.id === selectedId);

      if (isCorrect) {
        correct += 1;
        calculatedScore += q.points || 10;
      }

      recordedAnswers.push({
        question_id: q.id,
        question_index: idx,
        question_text: q.question_text,
        selected_option_id: selectedId || "",
        selected_option_text: selectedOption?.option_text || "",
        selected_option_index: selectedOptIdx >= 0 ? selectedOptIdx : undefined,
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
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
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 text-white font-semibold hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 transition-all shadow-md"
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
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
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-200"
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
                      className="text-[11px] text-slate-500 hover:text-blue-700 font-medium cursor-pointer underline mb-1.5 inline-block"
                    >
                      Bukan dari kelas di atas? Ketik manual di sini
                    </button>
                    {(!quiz.target_classes.includes(studentClass) || studentClass === "") && (
                      <input
                        type="text"
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="Ketik nama kelas Anda..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium bg-slate-50/50"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-medium"
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
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200"
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
              className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 shadow-lg shadow-blue-900/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base cursor-pointer mt-4"
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
    // Match-Up Game Mode
    if (isMatchUp) {
      const matchedCount = questions.filter((q) => Boolean(matchedSlots[q.id])).length;
      const progressPercent = questions.length > 0 ? (matchedCount / questions.length) * 100 : 0;
      const allMatched = matchedCount === questions.length && questions.length > 0;

      return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-5 w-full flex-1 flex flex-col justify-between pb-28 sm:pb-32">
          <div>
            {/* Tab switch anti-cheat warning */}
            {tabSwitchWarning && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between animate-bounce">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Peringatan!</strong> Pindah tab terdeteksi ({tabSwitchCount}x).
                  </span>
                </div>
                <button
                  onClick={() => setTabSwitchWarning(false)}
                  className="text-xs font-bold text-amber-700 underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Top Match-Up Game Header (Kompak & Responsif) */}
            <div className="glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs mb-3 sm:mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 sm:p-1.5 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                    <Puzzle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
                      {quiz.title}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      {studentName} • {studentClass}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {quiz.time_limit_minutes > 0 && (
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold border ${
                        secondsRemaining < 60
                          ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{formatTime(secondsRemaining)}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetAllMatches}
                    title="Lepaskan semua pasangan kembali ke pilihan"
                    className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 sm:mt-2.5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-semibold mb-1">
                  <span>Progres: {matchedCount} dari {questions.length} gambar</span>
                  <span className="text-purple-700 font-bold">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Interactive Help Hint - Ringkas & Dinamis */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                <p className="flex items-center gap-1.5 font-medium truncate w-full">
                  {activeTextCardId ? (
                    <span className="text-purple-700 font-bold flex items-center gap-1 animate-pulse">
                      <span>👉</span> Ketuk kotak pasang pada gambar (kiri) untuk menaruh teks!
                    </span>
                  ) : activeSlotQId ? (
                    <span className="text-purple-700 font-bold flex items-center gap-1 animate-pulse">
                      <span>👉</span> Ketuk kartu pilihan di kanan untuk mengisi kotak ini!
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>💡</span> <strong className="font-semibold text-slate-700">Cara:</strong> Ketuk kartu di kanan, lalu ketuk kotak di samping gambar.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Side-by-Side Playing Board (Kiri: Gambar + Kotak, Kanan: Pilihan Tulisan) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 items-start">
              {/* KOLOM KIRI: Daftar Gambar & Kotak Target */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span>🖼️ Gambar Soal</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                    {questions.length} Soal
                  </span>
                </div>

                {questions.map((q, idx) => {
                  const assignedCardId = matchedSlots[q.id];
                  const assignedCard = matchCards.find((c) => c.id === assignedCardId);
                  const isSlotActive = activeSlotQId === q.id;

                  return (
                    <div
                      key={q.id || `q-${idx}`}
                      onClick={() => handleSelectSlot(q.id)}
                      className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border transition-all shadow-2xs flex flex-col justify-between cursor-pointer select-none group active:scale-[0.99] ${
                        isSlotActive
                          ? "border-purple-600 ring-4 ring-purple-200 bg-purple-50/40 shadow-md scale-[1.01]"
                          : activeTextCardId && !assignedCard
                          ? "border-purple-400 hover:border-purple-600 hover:ring-2 hover:ring-purple-200 bg-purple-50/15"
                          : assignedCard
                          ? "border-purple-300 hover:border-purple-400 bg-white"
                          : "border-slate-200 hover:border-purple-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Kotak Gambar Utama (Area pilih seluas gambar) */}
                      <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-100 aspect-[16/11] max-h-32 sm:max-h-44 w-full flex items-center justify-center">
                        {q.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={q.image_url}
                            alt={`Gambar #${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                          />
                        ) : (
                          <div className="text-slate-400 text-center p-2 text-xs pointer-events-none">
                            <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                            <span>Gambar #{idx + 1}</span>
                          </div>
                        )}

                        {/* Indikator visual ketika gambar sedang dipilih / siap dipasangkan */}
                        {isSlotActive ? (
                          <div className="absolute inset-0 bg-purple-950/35 backdrop-blur-[1px] flex items-center justify-center p-1 pointer-events-none animate-in fade-in">
                            <span className="px-2 py-1 rounded-lg bg-purple-700 text-white font-extrabold text-[10px] sm:text-xs shadow-md animate-pulse text-center leading-tight">
                              👉 Pilih tulisan di kanan
                            </span>
                          </div>
                        ) : activeTextCardId && !assignedCard ? (
                          <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 pointer-events-none">
                            <span className="px-2 py-0.5 rounded-md bg-purple-700 text-white font-bold text-[10px] shadow-xs">
                              👉 Ketuk gambar ini
                            </span>
                          </div>
                        ) : null}

                        {/* Tombol Perbesar Gambar (stopPropagation agar tidak memicu pemilihan kartu) */}
                        {q.image_url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImageUrl(q.image_url || null);
                            }}
                            title="Perbesar Gambar"
                            className="absolute top-1.5 right-1.5 p-1 sm:p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-sm z-10"
                          >
                            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        )}

                        {/* Nomor Soal */}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-xs pointer-events-none z-10">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Kotak Target Pasangan di Bawah Gambar */}
                      <div className="mt-1.5 sm:mt-2">
                        {assignedCard ? (
                          <div
                            className="w-full py-1.5 px-2 rounded-lg sm:rounded-xl bg-purple-100/90 border-2 border-purple-400 text-purple-950 text-xs sm:text-sm font-bold flex items-center justify-between gap-1 shadow-2xs transition-all group-hover:bg-purple-100"
                          >
                            <span className="truncate leading-tight font-bold" title={assignedCard.text}>
                              {assignedCard.text}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDetachSlot(q.id, e)}
                              title="Lepaskan tulisan ini"
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md hover:bg-purple-200 text-purple-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`w-full py-2 px-1.5 rounded-lg sm:rounded-xl border-2 border-dashed text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 min-h-[38px] ${
                              isSlotActive
                                ? "border-purple-500 bg-purple-100/70 text-purple-700 ring-2 ring-purple-200 animate-pulse"
                                : activeTextCardId
                                ? "border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200 animate-pulse group-hover:bg-purple-100"
                                : "border-slate-300 bg-slate-50 group-hover:border-purple-300 group-hover:bg-purple-50/20 text-slate-500"
                            }`}
                          >
                            <span>
                              {isSlotActive ? "👉 Menunggu..." : activeTextCardId ? "👉 Pasang di sini" : "+ Pasangkan"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KOLOM KANAN: Bank Pilihan Tulisan */}
              {/* FIXED: top-[72px] sm:top-20 agar tidak menabrak navbar sticky (h-16 / 64px) */}
              {/* FIXED: max-h-[calc(100dvh-165px)] & overflow-y-auto agar kartu dapat di-scroll lancar di layar mobile */}
              <div className="sticky top-[72px] sm:top-20 z-20 max-h-[calc(100dvh-165px)] sm:max-h-[calc(100dvh-125px)] overflow-y-auto overscroll-contain pr-1 sm:pr-1.5">
                <div className="sticky top-0 bg-slate-50/95 backdrop-blur-xs py-1 z-10 flex items-center justify-between px-1 mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span>📝 Pilihan Tulisan</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                    {matchCards.length} Kartu
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  {matchCards.map((card) => {
                    const isPlaced = Object.values(matchedSlots).includes(card.id);
                    const isSelected = activeTextCardId === card.id;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleSelectTextCard(card.id)}
                        className={`w-full py-2.5 px-2.5 sm:py-3 sm:px-3 rounded-xl sm:rounded-2xl text-left font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-1.5 shadow-2xs min-h-[44px] ${
                          isSelected
                            ? "bg-purple-600 text-white border-2 border-purple-700 ring-4 ring-purple-200/80 shadow-md scale-[1.01]"
                            : isPlaced
                            ? "bg-slate-100/90 border-2 border-slate-200 text-slate-400 opacity-60"
                            : "bg-white border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-800 active:scale-98"
                        }`}
                      >
                        <span className="leading-snug break-words">
                          {card.text}
                        </span>

                        {isPlaced ? (
                          <span className="text-[9px] sm:text-[10px] font-bold bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded flex-shrink-0">
                            ✓
                          </span>
                        ) : isSelected ? (
                          <span className="text-[9px] sm:text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded flex-shrink-0 animate-pulse">
                            Dipilih
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Submission Bar (Responsif & Kompak) */}
          <div className="sticky bottom-2 sm:bottom-3 mt-4 sm:mt-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-between gap-2 sm:gap-3 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {matchedCount}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">
                  {allMatched ? "Semua Terpasang! 🎉" : `${matchedCount} dari ${questions.length} Terpasang`}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate hidden xs:block">
                  {allMatched ? "Siap untuk dikumpulkan" : "Pastikan semua gambar memiliki pasangan"}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishMatchUp}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 ${
                allMatched
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25 ring-2 ring-emerald-200"
                  : "bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-purple-900/25"
              }`}
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isSubmitting ? "Mengirim..." : "Kirim Jawaban"}</span>
            </button>
          </div>

          {/* Zoom Modal Lightbox */}
          {zoomedImageUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setZoomedImageUrl(null)}
            >
              <div
                className="relative max-w-2xl max-h-[90vh] bg-white rounded-3xl p-2 shadow-2xl overflow-hidden flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white z-10 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedImageUrl}
                  alt="Detail Gambar Soal"
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
                />
                <p className="text-xs text-slate-500 py-2 font-medium">
                  Klik di luar gambar atau tombol X untuk menutup
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

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
              <span className="font-extrabold text-sm md:text-base text-blue-800">
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
              className="bg-gradient-to-r from-blue-900 via-blue-600 to-sky-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="glass-card rounded-3xl p-6 md:p-8 shadow-lg border border-slate-200 bg-white my-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-4">
              <span>{quiz.title}</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
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
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {letter}
                    </div>

                    <span
                      className={`flex-1 text-sm md:text-base font-medium leading-snug ${
                        isSelected ? "text-blue-950 font-bold" : "text-slate-800"
                      }`}
                    >
                      {option.option_text}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 text-white font-semibold text-xs md:text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
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

        <div className="my-6 p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            Nilai Akhir Kamu
          </span>
          <div className="text-5xl md:text-6xl font-black text-blue-800 font-mono tracking-tight">
            {finalScore}
          </div>
          <p className="mt-2 text-xs md:text-sm font-semibold text-blue-900">
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
            <span className="text-lg font-bold text-blue-700">
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

        {quiz.show_answer_review !== false ? (
          <div className="text-left mb-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
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
                      {isMatchUp
                        ? `Pasangan #${idx + 1}`
                        : `${idx + 1}. ${q.question_text}`}
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
                        {isMatchUp ? "Pasanganmu: " : "Jawabanmu: "}
                        {studentAns?.selected_option_text || selectedOpt?.option_text || "(Tidak dijawab)"} {isCorrect ? "✓ Benar" : "✗ Salah"}
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-500">
                          {isMatchUp ? "Pasangan yang Benar: " : "Kunci Jawaban: "}
                          <strong className="text-slate-700">
                            {q.question_text || correctOpt?.option_text}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2">
              <EyeOff className="w-4 h-4" />
            </div>
            <p className="text-xs md:text-sm font-bold text-slate-800">
              Review Jawaban Disembunyikan
            </p>
            <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              Guru menonaktifkan tampilan kunci jawaban untuk kuis ini. Nilai Anda telah tercatat dengan aman di sistem.
            </p>
          </div>
        )}

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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 text-white font-bold text-xs md:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
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
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Menyiapkan kuis...</p>
        </div>
      }
    >
      <PlayQuizContent />
    </Suspense>
  );
}
