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
  Minimize2,
  X,
} from "lucide-react";
import { getQuizByCode, submitQuizAnswers } from "@/lib/quizStore";
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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabSwitchWarning, setTabSwitchWarning] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  // Stopwatch elapsed timer (Wordwall style)
  useEffect(() => {
    if (stage !== "playing") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const questions: Question[] = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Auto-initialize match cards safety fallback
  useEffect(() => {
    if (stage === "playing" && quiz?.quiz_type === "match_up" && questions.length > 0 && matchCards.length === 0) {
      const cards: MatchUpCard[] = questions.map((q, idx) => ({
        id: `card-${q.id || idx}`,
        text: (q.question_text || q.options?.[0]?.option_text || "").trim(),
        sourceQuestionId: q.id,
      }));
      setMatchCards([...cards].sort(() => Math.random() - 0.5));
    }
  }, [stage, quiz, questions, matchCards.length]);

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
    if (quiz?.quiz_type === "match_up" && quiz.questions) {
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
    if (quiz.quiz_type === "match_up") {
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
    // Match-Up Game Mode (Wordwall Style Cosmic Theme)
    if (quiz.quiz_type === "match_up") {
      const matchedCount = questions.filter((q) => Boolean(matchedSlots[q.id])).length;
      const progressPercent = questions.length > 0 ? (matchedCount / questions.length) * 100 : 0;
      const allMatched = matchedCount === questions.length && questions.length > 0;
      const rowCount = Math.max(questions.length, matchCards.length);

      return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-gradient-to-b from-[#110329] via-[#1a073e] to-[#090116] text-white pb-28 overflow-x-hidden selection:bg-purple-500 selection:text-white">
          {/* Cosmic Nebula & Planetary Glows */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-600/15 via-purple-600/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute bottom-20 right-0 w-80 h-80 rounded-full bg-gradient-to-tl from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />

          {/* Top Sticky Game Bar */}
          <div className="sticky top-16 z-20 bg-[#0d011e]/90 backdrop-blur-md border-b border-purple-500/25 px-3 py-2 sm:px-6 sm:py-2.5 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              {/* Digital Stopwatch / Timer (Top Left as in Reference) */}
              <div className="flex items-center gap-2">
                <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider flex items-center gap-2 drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  <span>
                    {quiz.time_limit_minutes > 0
                      ? formatTime(secondsRemaining)
                      : formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Title & Student Info (Center) */}
              <div className="text-center truncate hidden xs:block">
                <h2 className="text-xs sm:text-sm font-extrabold text-purple-100 truncate max-w-[200px] sm:max-w-xs">
                  {quiz.title}
                </h2>
                <p className="text-[10px] text-purple-300/70 truncate">
                  {studentName} • {studentClass}
                </p>
              </div>

              {/* Progress Counter Badge (Top Right) */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full text-xs font-black bg-purple-900/80 border border-purple-400/40 text-purple-200 flex items-center gap-1.5 shadow-sm">
                  <Puzzle className="w-3.5 h-3.5 text-purple-300" />
                  <span>{matchedCount} / {questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Game Playing Board */}
          <div className="relative z-10 max-w-4xl mx-auto w-full px-2 sm:px-4 py-3 sm:py-4 flex-1">
            {/* Anti-cheat tab switch warning */}
            {tabSwitchWarning && (
              <div className="mb-3 p-3 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>Peringatan!</strong> Pindah tab terdeteksi ({tabSwitchCount}x).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTabSwitchWarning(false)}
                  className="text-xs font-bold text-amber-300 underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Column Header Labels */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 px-1 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-purple-300/80">
              <div className="flex items-center gap-1 truncate">
                <span>🖼️ Gambar & Kotak Pasangan</span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <span>📝 Pilihan Tulisan</span>
              </div>
            </div>

            {/* Synchronized Row-by-Row Grid */}
            <div className="space-y-2 sm:space-y-2.5">
              {Array.from({ length: rowCount }).map((_, idx) => {
                const q = questions[idx];
                const assignedCardId = q ? matchedSlots[q.id] : null;
                const assignedCard = assignedCardId ? matchCards.find((c) => c.id === assignedCardId) : null;
                const isSlotActive = q ? activeSlotQId === q.id : false;

                const rightCard = matchCards[idx];
                const isRightCardPlaced = rightCard ? Object.values(matchedSlots).includes(rightCard.id) : false;
                const isRightCardSelected = rightCard ? activeTextCardId === rightCard.id : false;

                return (
                  <div
                    key={q?.id || rightCard?.id || `row-${idx}`}
                    className="grid grid-cols-2 gap-2 sm:gap-3 items-center"
                  >
                    {/* LEFT: Image Thumbnail + Drop Slot */}
                    {q ? (
                      <div className="flex items-center gap-1.5 sm:gap-2.5 h-14 sm:h-16">
                        {/* Gold-framed Picture Thumbnail (Click to Zoom) */}
                        <div
                          onClick={() => q.image_url && setZoomedImageUrl(q.image_url)}
                          className="relative flex-shrink-0 w-14 h-12 sm:w-16 sm:h-14 rounded-lg p-0.5 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-md shadow-amber-500/20 cursor-pointer group transition-transform active:scale-95"
                          title="Ketuk gambar untuk memperbesar"
                        >
                          <div className="relative w-full h-full rounded-[6px] overflow-hidden bg-slate-900 flex items-center justify-center">
                            {q.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={q.image_url}
                                alt={`Gambar #${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-amber-300/60" />
                            )}
                            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-black/75 text-amber-300 font-mono text-[9px] font-bold">
                              #{idx + 1}
                            </span>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>

                        {/* Drop Slot */}
                        <div className="flex-1 h-full min-w-0">
                          {assignedCard ? (
                            <div
                              onClick={() => handleSelectSlot(q.id)}
                              className="h-full w-full rounded-xl border-2 border-purple-400/80 bg-gradient-to-r from-purple-800/90 to-indigo-800/90 shadow-md flex items-center justify-between px-2 sm:px-2.5 py-1 gap-1 cursor-pointer hover:border-purple-300 transition-all text-white group"
                              title="Klik untuk memilih ulang atau ganti tulisan"
                            >
                              <span className="text-xs sm:text-sm font-bold leading-tight truncate">
                                {assignedCard.text}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDetachSlot(q.id, e)}
                                title="Lepaskan tulisan ini"
                                className="w-5 h-5 rounded-full bg-purple-900/70 hover:bg-rose-600 text-purple-200 hover:text-white flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectSlot(q.id)}
                              className={`h-full w-full rounded-xl border-2 transition-all flex items-center justify-center text-center px-1.5 cursor-pointer ${
                                isSlotActive
                                  ? "border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
                                  : activeTextCardId
                                  ? "border-dashed border-purple-400 bg-purple-900/40 text-purple-200 hover:border-cyan-400 hover:bg-cyan-950/40"
                                  : "border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/40 hover:border-purple-400 text-purple-300/70"
                              }`}
                            >
                              <span className="text-[11px] sm:text-xs font-bold leading-tight truncate">
                                {isSlotActive ? "👉 Pasang Di Sini" : activeTextCardId ? "+ Pasang Di Sini" : "+ Pasangkan"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-14 sm:h-16" />
                    )}

                    {/* RIGHT: Text Choice Card */}
                    {rightCard ? (
                      <div className="h-14 sm:h-16">
                        <button
                          type="button"
                          disabled={isRightCardPlaced}
                          onClick={() => handleSelectTextCard(rightCard.id)}
                          className={`h-full w-full rounded-xl text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between px-2.5 sm:px-3 py-1.5 gap-1.5 shadow-sm ${
                            isRightCardSelected
                              ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-2 border-cyan-300 text-white ring-4 ring-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[1.02] cursor-pointer"
                              : isRightCardPlaced
                              ? "bg-purple-950/30 border border-purple-800/30 text-purple-400/40 opacity-40 cursor-default"
                              : "bg-purple-900/50 hover:bg-purple-800/70 border-2 border-purple-400/40 hover:border-purple-300 text-white active:scale-98 cursor-pointer shadow-purple-950/40"
                          }`}
                        >
                          <span
                            className={`leading-snug break-words line-clamp-2 ${
                              isRightCardPlaced ? "line-through" : ""
                            }`}
                          >
                            {rightCard.text}
                          </span>

                          {isRightCardPlaced ? (
                            <span className="text-[10px] font-bold bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded flex-shrink-0">
                              ✓
                            </span>
                          ) : isRightCardSelected ? (
                            <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded flex-shrink-0 animate-pulse">
                              Dipilih
                            </span>
                          ) : null}
                        </button>
                      </div>
                    ) : (
                      <div className="h-14 sm:h-16" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Bar (Wordwall Style with Submit Answers) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d011e]/95 backdrop-blur-md border-t border-purple-500/30 px-3 py-2.5 sm:px-6 sm:py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              {/* Left: Reset Button */}
              <button
                type="button"
                onClick={handleResetAllMatches}
                title="Reset semua pasangan"
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Center: Submit Answers (Prominent Wordwall Button) */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinishMatchUp}
                className={`px-6 sm:px-8 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-2 border-2 ${
                  allMatched
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40 animate-pulse"
                    : "bg-purple-900/80 hover:bg-purple-800 border-purple-400/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Mengirim..." : "Submit Answers (Kirim)"}</span>
              </button>

              {/* Right: Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? "Kecilkan" : "Penuh"}</span>
              </button>
            </div>
          </div>

          {/* Lightbox Zoom Modal for Images */}
          {zoomedImageUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setZoomedImageUrl(null)}
            >
              <div
                className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-purple-500/40 rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-rose-600 text-white z-10 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedImageUrl}
                  alt="Detail Gambar Soal"
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
                />
                <p className="text-xs text-purple-300 py-2 font-medium">
                  Ketuk tombol ✕ atau di luar gambar untuk menutup
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
                      {quiz.quiz_type === "match_up"
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
                        {quiz.quiz_type === "match_up" ? "Pasanganmu: " : "Jawabanmu: "}
                        {studentAns?.selected_option_text || selectedOpt?.option_text || "(Tidak dijawab)"} {isCorrect ? "✓ Benar" : "✗ Salah"}
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-500">
                          {quiz.quiz_type === "match_up" ? "Pasangan yang Benar: " : "Kunci Jawaban: "}
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
