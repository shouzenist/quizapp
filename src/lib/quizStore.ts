import { Quiz, Question, Submission, StudentAnswer } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";

const DEMO_QUIZZES: Quiz[] = [
  {
    id: "quiz-demo-1",
    title: "Kuis Wawasan Nusantara & Sains Seru",
    description: "Uji seberapa luas pengetahuanmu tentang alam, sains, dan Indonesia! Jawab dengan teliti ya.",
    subject: "Pengetahuan Umum",
    quiz_code: "PINTAR",
    is_active: true,
    time_limit_minutes: 5,
    shuffle_questions: false,
    created_at: new Date().toISOString(),
    submissions_count: 5,
    questions: [
      {
        id: "q-1",
        question_text: "Apa nama ibu kota negara Indonesia yang baru yang berada di Kalimantan Timur?",
        points: 20,
        order_index: 0,
        options: [
          { id: "opt-1-1", option_text: "Nusantara (IKN)", is_correct: true },
          { id: "opt-1-2", option_text: "Balikpapan", is_correct: false },
          { id: "opt-1-3", option_text: "Samarinda", is_correct: false },
          { id: "opt-1-4", option_text: "Banjarmasin", is_correct: false },
        ],
      },
      {
        id: "q-2",
        question_text: "Planet manakah yang dijuluki sebagai 'Planet Merah' dalam tata surya kita?",
        points: 20,
        order_index: 1,
        options: [
          { id: "opt-2-1", option_text: "Venus", is_correct: false },
          { id: "opt-2-2", option_text: "Mars", is_correct: true },
          { id: "opt-2-3", option_text: "Jupiter", is_correct: false },
          { id: "opt-2-4", option_text: "Merkurius", is_correct: false },
        ],
      },
      {
        id: "q-3",
        question_text: "Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...",
        points: 20,
        order_index: 2,
        options: [
          { id: "opt-3-1", option_text: "Paru-paru", is_correct: false },
          { id: "opt-3-2", option_text: "Lambung", is_correct: false },
          { id: "opt-3-3", option_text: "Jantung", is_correct: true },
          { id: "opt-3-4", option_text: "Hati", is_correct: false },
        ],
      },
      {
        id: "q-4",
        question_text: "Siapakah tokoh pahlawan nasional yang dikenal sebagai 'Bapak Pendidikan Nasional'?",
        points: 20,
        order_index: 3,
        options: [
          { id: "opt-4-1", option_text: "Ki Hajar Dewantara", is_correct: true },
          { id: "opt-4-2", option_text: "Ir. Soekarno", is_correct: false },
          { id: "opt-4-3", option_text: "Mohammad Hatta", is_correct: false },
          { id: "opt-4-4", option_text: "R.A. Kartini", is_correct: false },
        ],
      },
      {
        id: "q-5",
        question_text: "Gas apakah yang diserap oleh tumbuhan hijau pada saat proses fotosintesis?",
        points: 20,
        order_index: 4,
        options: [
          { id: "opt-5-1", option_text: "Oksigen", is_correct: false },
          { id: "opt-5-2", option_text: "Nitrogen", is_correct: false },
          { id: "opt-5-3", option_text: "Karbondioksida (CO2)", is_correct: true },
          { id: "opt-5-4", option_text: "Hidrogen", is_correct: false },
        ],
      },
    ],
  },
  {
    id: "quiz-demo-2",
    title: "Matematika & Asah Logika Cepat",
    description: "Kuis latihan berhitung dan logika berpikir tingkat SMP/SMA.",
    subject: "Matematika",
    quiz_code: "JUARA1",
    is_active: true,
    time_limit_minutes: 3,
    shuffle_questions: false,
    created_at: new Date().toISOString(),
    submissions_count: 3,
    questions: [
      {
        id: "m-1",
        question_text: "Berapakah hasil dari: 15 + 25 × 2 ?",
        points: 25,
        order_index: 0,
        options: [
          { id: "m-1-1", option_text: "80", is_correct: false },
          { id: "m-1-2", option_text: "65", is_correct: true },
          { id: "m-1-3", option_text: "70", is_correct: false },
          { id: "m-1-4", option_text: "55", is_correct: false },
        ],
      },
      {
        id: "m-2",
        question_text: "Jika sebuah persegi memiliki keliling 40 cm, berapakah luas persegi tersebut?",
        points: 25,
        order_index: 1,
        options: [
          { id: "m-2-1", option_text: "100 cm²", is_correct: true },
          { id: "m-2-2", option_text: "160 cm²", is_correct: false },
          { id: "m-2-3", option_text: "80 cm²", is_correct: false },
          { id: "m-2-4", option_text: "20 cm²", is_correct: false },
        ],
      },
      {
        id: "m-3",
        question_text: "Bilangan prima terkecil yang lebih besar dari 10 adalah...",
        points: 25,
        order_index: 2,
        options: [
          { id: "m-3-1", option_text: "11", is_correct: true },
          { id: "m-3-2", option_text: "12", is_correct: false },
          { id: "m-3-3", option_text: "13", is_correct: false },
          { id: "m-3-4", option_text: "15", is_correct: false },
        ],
      },
      {
        id: "m-4",
        question_text: "Jika 3 buku seharga Rp 45.000, berapakah harga untuk 5 buku serupa?",
        points: 25,
        order_index: 3,
        options: [
          { id: "m-4-1", option_text: "Rp 60.000", is_correct: false },
          { id: "m-4-2", option_text: "Rp 70.000", is_correct: false },
          { id: "m-4-3", option_text: "Rp 75.000", is_correct: true },
          { id: "m-4-4", option_text: "Rp 90.000", is_correct: false },
        ],
      },
    ],
  },
];

const DEMO_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    quiz_id: "quiz-demo-1",
    student_name: "Ahmad Fauzi",
    student_class: "7A",
    score: 100,
    total_questions: 5,
    correct_answers: 5,
    tab_switch_count: 0,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3400000).toISOString(),
  },
  {
    id: "sub-2",
    quiz_id: "quiz-demo-1",
    student_name: "Siti Rahmawati",
    student_class: "7A",
    score: 80,
    total_questions: 5,
    correct_answers: 4,
    tab_switch_count: 0,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: "sub-3",
    quiz_id: "quiz-demo-1",
    student_name: "Budi Santoso",
    student_class: "7B",
    score: 60,
    total_questions: 5,
    correct_answers: 3,
    tab_switch_count: 1,
    started_at: new Date(Date.now() - 5000000).toISOString(),
    completed_at: new Date(Date.now() - 4800000).toISOString(),
  },
  {
    id: "sub-4",
    quiz_id: "quiz-demo-1",
    student_name: "Dewi Lestari",
    student_class: "7B",
    score: 100,
    total_questions: 5,
    correct_answers: 5,
    tab_switch_count: 0,
    started_at: new Date(Date.now() - 2500000).toISOString(),
    completed_at: new Date(Date.now() - 2300000).toISOString(),
  },
  {
    id: "sub-5",
    quiz_id: "quiz-demo-1",
    student_name: "Rizky Pratama",
    student_class: "7A",
    score: 80,
    total_questions: 5,
    correct_answers: 4,
    tab_switch_count: 0,
    started_at: new Date(Date.now() - 1500000).toISOString(),
    completed_at: new Date(Date.now() - 1300000).toISOString(),
  },
];

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
// PUBLIC API FOR QUIZZES & SUBMISSIONS
// -------------------------------------------------------------

export async function getAllQuizzes(): Promise<Quiz[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*)), submissions(count)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((q) => ({
          ...q,
          submissions_count: q.submissions?.[0]?.count || 0,
        }));
      }
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
        .single();

      if (!error && data) {
        return data as Quiz;
      }
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
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*))")
        .eq("id", id)
        .single();

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
      // 1. Insert/Update Quiz in Supabase
      const isNew = !quizData.id || quizData.id.startsWith("quiz-temp-");
      const quizId = isNew ? undefined : quizData.id;

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
        })
        .select()
        .single();

      if (!quizError && quizResult) {
        // If questions provided, save questions and options
        if (quizData.questions && quizData.questions.length > 0) {
          for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            const { data: questionResult } = await supabase
              .from("questions")
              .insert({
                quiz_id: quizResult.id,
                question_text: q.question_text,
                points: q.points,
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
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (!error) return true;
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
  if (isSupabaseConfigured) {
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
          const detailRows = params.answers.map((a) => ({
            submission_id: subData.id,
            question_id: a.question_id,
            selected_option_id: a.selected_option_id,
            is_correct: a.is_correct,
          }));
          await supabase.from("submission_answers").insert(detailRows);
        }
        return subData as Submission;
      }
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
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, answers:submission_answers(*)")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      if (!error && data) {
        return data as Submission[];
      }
    } catch (e) {
      console.warn("Supabase fetch submissions failed:", e);
    }
  }

  const submissions = getLocalSubmissions();
  return submissions
    .filter((s) => s.quiz_id === quizId)
    .sort((a, b) => b.score - a.score);
}
