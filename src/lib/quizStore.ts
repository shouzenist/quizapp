import { Quiz, Question, Submission, StudentAnswer } from "./types";
import { supabase, isSupabaseConfigured, supabaseUrl } from "./supabase";

export function isValidUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const DEMO_QUIZZES: Quiz[] = [
  {
    id: "d0000001-0000-0000-0000-000000000001",
    title: "Kuis Wawasan Nusantara & Sains Seru",
    description: "Uji seberapa luas pengetahuanmu tentang alam, sains, dan Indonesia! Jawab dengan teliti ya.",
    subject: "Pengetahuan Umum",
    quiz_code: "PINTAR",
    is_active: true,
    show_answer_review: true,
    time_limit_minutes: 5,
    shuffle_questions: false,
    target_classes: ["7A", "7B", "7C", "7D"],
    created_at: new Date().toISOString(),
    submissions_count: 5,
    questions: [
      {
        id: "d0000001-0000-0000-0000-000000000011",
        question_text: "Apa nama ibu kota negara Indonesia yang baru yang berada di Kalimantan Timur?",
        points: 20,
        order_index: 0,
        options: [
          { id: "d0000001-0000-0000-0000-000000000111", option_text: "Nusantara (IKN)", is_correct: true },
          { id: "d0000001-0000-0000-0000-000000000112", option_text: "Balikpapan", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000113", option_text: "Samarinda", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000114", option_text: "Banjarmasin", is_correct: false },
        ],
      },
      {
        id: "d0000001-0000-0000-0000-000000000012",
        question_text: "Planet manakah yang dijuluki sebagai 'Planet Merah' dalam tata surya kita?",
        points: 20,
        order_index: 1,
        options: [
          { id: "d0000001-0000-0000-0000-000000000121", option_text: "Venus", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000122", option_text: "Mars", is_correct: true },
          { id: "d0000001-0000-0000-0000-000000000123", option_text: "Jupiter", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000124", option_text: "Merkurius", is_correct: false },
        ],
      },
      {
        id: "d0000001-0000-0000-0000-000000000013",
        question_text: "Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...",
        points: 20,
        order_index: 2,
        options: [
          { id: "d0000001-0000-0000-0000-000000000131", option_text: "Paru-paru", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000132", option_text: "Lambung", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000133", option_text: "Jantung", is_correct: true },
          { id: "d0000001-0000-0000-0000-000000000134", option_text: "Hati", is_correct: false },
        ],
      },
      {
        id: "d0000001-0000-0000-0000-000000000014",
        question_text: "Siapakah tokoh pahlawan nasional yang dikenal sebagai 'Bapak Pendidikan Nasional'?",
        points: 20,
        order_index: 3,
        options: [
          { id: "d0000001-0000-0000-0000-000000000141", option_text: "Ki Hajar Dewantara", is_correct: true },
          { id: "d0000001-0000-0000-0000-000000000142", option_text: "Ir. Soekarno", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000143", option_text: "Mohammad Hatta", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000144", option_text: "R.A. Kartini", is_correct: false },
        ],
      },
      {
        id: "d0000001-0000-0000-0000-000000000015",
        question_text: "Gas apakah yang diserap oleh tumbuhan hijau pada saat proses fotosintesis?",
        points: 20,
        order_index: 4,
        options: [
          { id: "d0000001-0000-0000-0000-000000000151", option_text: "Oksigen", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000152", option_text: "Nitrogen", is_correct: false },
          { id: "d0000001-0000-0000-0000-000000000153", option_text: "Karbondioksida (CO2)", is_correct: true },
          { id: "d0000001-0000-0000-0000-000000000154", option_text: "Hidrogen", is_correct: false },
        ],
      },
    ],
  },
  {
    id: "d0000002-0000-0000-0000-000000000002",
    title: "Matematika & Asah Logika Cepat",
    description: "Kuis latihan berhitung dan logika berpikir tingkat SMP/SMA.",
    subject: "Matematika",
    quiz_code: "JUARA1",
    is_active: true,
    show_answer_review: true,
    time_limit_minutes: 3,
    shuffle_questions: false,
    target_classes: ["10 MIPA 1", "10 MIPA 2", "10 IPS 1"],
    created_at: new Date().toISOString(),
    submissions_count: 3,
    questions: [
      {
        id: "d0000002-0000-0000-0000-000000000021",
        question_text: "Berapakah hasil dari: 15 + 25 × 2 ?",
        points: 25,
        order_index: 0,
        options: [
          { id: "d0000002-0000-0000-0000-000000000211", option_text: "80", is_correct: false },
          { id: "d0000002-0000-0000-0000-000000000212", option_text: "65", is_correct: true },
          { id: "d0000002-0000-0000-0000-000000000213", option_text: "70", is_correct: false },
          { id: "d0000002-0000-0000-0000-000000000214", option_text: "55", is_correct: false },
        ],
      },
      {
        id: "d0000002-0000-0000-0000-000000000022",
        question_text: "Jika sebuah persegi memiliki keliling 40 cm, berapakah luas persegi tersebut?",
        points: 25,
        order_index: 1,
        options: [
          { id: "d0000002-0000-0000-0000-000000000221", option_text: "100 cm²", is_correct: true },
          { id: "d0000002-0000-0000-0000-000000000222", option_text: "160 cm²", is_correct: false },
          { id: "d0000002-0000-0000-0000-000000000223", option_text: "80 cm²", is_correct: false },
          { id: "d0000002-0000-0000-0000-000000000224", option_text: "20 cm²", is_correct: false },
        ],
      },
    ],
  },
];

const DEMO_SUBMISSIONS: Submission[] = [];

// LocalStorage helpers
function getLocalQuizzes(): Quiz[] {
  if (typeof window === "undefined") return DEMO_QUIZZES;
  const stored = localStorage.getItem("quizapp_quizzes");
  if (!stored) {
    localStorage.setItem("quizapp_quizzes", JSON.stringify(DEMO_QUIZZES));
    return DEMO_QUIZZES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEMO_QUIZZES;
  }
}

function saveLocalQuizzes(quizzes: Quiz[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("quizapp_quizzes", JSON.stringify(quizzes));
}

function getLocalSubmissions(): Submission[] {
  if (typeof window === "undefined") return DEMO_SUBMISSIONS;
  const stored = localStorage.getItem("quizapp_submissions");
  if (!stored) {
    localStorage.setItem("quizapp_submissions", JSON.stringify(DEMO_SUBMISSIONS));
    return DEMO_SUBMISSIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEMO_SUBMISSIONS;
  }
}

function saveLocalSubmissions(submissions: Submission[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("quizapp_submissions", JSON.stringify(submissions));
}

// -------------------------------------------------------------
// CONNECTION DIAGNOSTICS
// -------------------------------------------------------------
export async function getSupabaseDiagnostic(): Promise<{
  isConfigured: boolean;
  connected: boolean;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      connected: false,
      message: "Variabel NEXT_PUBLIC_SUPABASE_URL belum terbaca di Vercel.",
    };
  }

  try {
    const { data, error } = await supabase.from("quizzes").select("id").limit(1);
    if (error) {
      return {
        isConfigured: true,
        connected: false,
        message: `Koneksi Supabase Error: ${error.message}`,
        error: error.message,
      };
    }
    return {
      isConfigured: true,
      connected: true,
      message: `Tersambung ke Supabase (${supabaseUrl.replace(/^https?:\/\//, "").split(".")[0]})`,
    };
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    return {
      isConfigured: true,
      connected: false,
      message: `Gagal mengakses Supabase: ${errObj.message || "Network Error"}`,
      error: errObj.message,
    };
  }
}

// -------------------------------------------------------------
// PUBLIC API FOR QUIZZES & SUBMISSIONS
// -------------------------------------------------------------

export async function getAllQuizzes(): Promise<Quiz[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*))")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Query counts
        const { data: subCounts } = await supabase
          .from("submissions")
          .select("quiz_id");

        const countsMap: Record<string, number> = {};
        if (subCounts) {
          subCounts.forEach((s) => {
            countsMap[s.quiz_id] = (countsMap[s.quiz_id] || 0) + 1;
          });
        }

        return data.map((q) => ({
          ...q,
          submissions_count: countsMap[q.id] || 0,
        }));
      }
      console.warn("Supabase query quizzes returned error:", error);
    } catch (e) {
      console.warn("Supabase query failed, falling back to local storage:", e);
    }
  }

  const quizzes = getLocalQuizzes();
  const submissions = getLocalSubmissions();
  return quizzes.map((q) => ({
    ...q,
    submissions_count: submissions.filter((s) => s.quiz_id === q.id).length,
  }));
}

export async function getQuizByCode(code: string): Promise<Quiz | null> {
  const cleanCode = code.trim().toUpperCase();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*))")
        .eq("quiz_code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        return data as Quiz;
      }
      console.warn("Supabase getQuizByCode error:", error);
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to local storage:", e);
    }
  }

  const quizzes = getLocalQuizzes();
  const quiz = quizzes.find(
    (q) => q.quiz_code.toUpperCase() === cleanCode && q.is_active
  );
  return quiz || null;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  if (isSupabaseConfigured && isValidUuid(id)) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*))")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return data as Quiz;
      }
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to local storage:", e);
    }
  }

  const quizzes = getLocalQuizzes();
  return quizzes.find((q) => q.id === id) || null;
}

export async function saveQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
  if (isSupabaseConfigured) {
    try {
      const hasValidId = isValidUuid(quizData.id);
      const quizId = hasValidId ? quizData.id : undefined;

      const { data: quizResult, error: quizError } = await supabase
        .from("quizzes")
        .upsert({
          ...(quizId ? { id: quizId } : {}),
          title: quizData.title,
          description: quizData.description,
          subject: quizData.subject,
          quiz_code: quizData.quiz_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
          is_active: quizData.is_active ?? true,
          time_limit_minutes: quizData.time_limit_minutes ?? 0,
          shuffle_questions: quizData.shuffle_questions ?? false,
          target_classes: quizData.target_classes || [],
          show_answer_review: quizData.show_answer_review ?? true,
        })
        .select()
        .single();

      if (!quizError && quizResult) {
        // If this was an update, delete old questions to recreate cleanly
        if (hasValidId) {
          await supabase.from("questions").delete().eq("quiz_id", quizResult.id);
        }

        // Insert fresh questions & options
        if (quizData.questions && quizData.questions.length > 0) {
          for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            const { data: questionResult } = await supabase
              .from("questions")
              .insert({
                quiz_id: quizResult.id,
                question_text: q.question_text,
                image_url: q.image_url || null,
                points: q.points || 10,
                order_index: i,
              })
              .select()
              .single();

            if (questionResult && q.options) {
              const optionsPayload = q.options.map((opt) => ({
                question_id: questionResult.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
              }));
              await supabase.from("options").insert(optionsPayload);
            }
          }
        }

        return quizResult as Quiz;
      } else {
        console.error("Supabase upsert quiz error:", quizError);
      }
    } catch (e) {
      console.warn("Supabase save failed, falling back to local storage:", e);
    }
  }

  // Local Storage Save
  const quizzes = getLocalQuizzes();
  const existingIndex = quizzes.findIndex((q) => q.id === quizData.id);

  if (existingIndex >= 0) {
    const updated: Quiz = {
      ...quizzes[existingIndex],
      ...quizData,
      target_classes: quizData.target_classes ?? quizzes[existingIndex].target_classes ?? [],
      show_answer_review: quizData.show_answer_review ?? quizzes[existingIndex].show_answer_review ?? true,
    } as Quiz;
    quizzes[existingIndex] = updated;
    saveLocalQuizzes(quizzes);
    return updated;
  } else {
    const newQuiz: Quiz = {
      id: "quiz-" + Date.now(),
      title: quizData.title || "Kuis Baru",
      description: quizData.description || "",
      subject: quizData.subject || "Umum",
      quiz_code: quizData.quiz_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      is_active: quizData.is_active ?? true,
      time_limit_minutes: quizData.time_limit_minutes ?? 0,
      shuffle_questions: quizData.shuffle_questions ?? false,
      target_classes: quizData.target_classes || [],
      show_answer_review: quizData.show_answer_review ?? true,
      created_at: new Date().toISOString(),
      questions: quizData.questions || [],
      submissions_count: 0,
    };
    quizzes.unshift(newQuiz);
    saveLocalQuizzes(quizzes);
    return newQuiz;
  }
}

export async function deleteQuiz(id: string): Promise<boolean> {
  if (isSupabaseConfigured && isValidUuid(id)) {
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (!error) {
        // Also remove from local if it was there
        const quizzes = getLocalQuizzes();
        saveLocalQuizzes(quizzes.filter((q) => q.id !== id));
        return true;
      }
      console.error("Supabase deleteQuiz error:", error);
    } catch (e) {
      console.warn("Supabase delete failed:", e);
    }
  }

  const quizzes = getLocalQuizzes();
  const filtered = quizzes.filter((q) => q.id !== id);
  saveLocalQuizzes(filtered);
  return true;
}

export async function submitQuizAnswers(params: {
  quiz_id: string;
  student_name: string;
  student_class: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  tab_switch_count: number;
  started_at: string;
  completed_at: string;
  answers: StudentAnswer[];
}): Promise<Submission> {
  if (isSupabaseConfigured && isValidUuid(params.quiz_id)) {
    try {
      const { data: subData, error } = await supabase
        .from("submissions")
        .insert({
          quiz_id: params.quiz_id,
          student_name: params.student_name,
          student_class: params.student_class,
          score: params.score,
          total_questions: params.total_questions,
          correct_answers: params.correct_answers,
          tab_switch_count: params.tab_switch_count,
          started_at: params.started_at,
          completed_at: params.completed_at,
        })
        .select()
        .single();

      if (!error && subData) {
        if (params.answers.length > 0) {
          const detailRows = params.answers
            .filter((a) => isValidUuid(a.question_id))
            .map((a) => ({
              submission_id: subData.id,
              question_id: a.question_id,
              selected_option_id: isValidUuid(a.selected_option_id) ? a.selected_option_id : null,
              is_correct: a.is_correct,
            }));
          if (detailRows.length > 0) {
            await supabase.from("submission_answers").insert(detailRows);
          }
        }
        return subData as Submission;
      }
      console.error("Supabase insert submission error:", error);
    } catch (e) {
      console.warn("Supabase submission failed, falling back to local storage:", e);
    }
  }

  const submissions = getLocalSubmissions();
  const newSub: Submission = {
    id: "sub-" + Date.now(),
    ...params,
  };
  submissions.unshift(newSub);
  saveLocalSubmissions(submissions);
  return newSub;
}

export async function getSubmissionsByQuizId(quizId: string): Promise<Submission[]> {
  if (isSupabaseConfigured && isValidUuid(quizId)) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, answers:submission_answers(*)")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      if (!error && data) {
        return data as Submission[];
      }
      console.error("Supabase getSubmissionsByQuizId error:", error);
    } catch (e) {
      console.warn("Supabase fetch submissions failed:", e);
    }
  }

  const submissions = getLocalSubmissions();
  return submissions
    .filter((s) => s.quiz_id === quizId)
    .sort((a, b) => b.score - a.score);
}
