export interface Option {
  id: string;
  question_id?: string;
  option_text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  quiz_id?: string;
  question_text: string;
  image_url?: string;
  points: number;
  order_index: number;
  options: Option[];
}

export interface Quiz {
  id: string;
  teacher_id?: string;
  title: string;
  description: string;
  subject?: string;
  quiz_code: string; // 6-digit code e.g. "QK8821"
  is_active: boolean;
  show_answer_review?: boolean; // true = show answer review to students, false = hide
  time_limit_minutes: number; // 0 for unlimited
  shuffle_questions: boolean;
  target_classes?: string[];
  created_at: string;
  questions?: Question[];
  submissions_count?: number;
}

export interface StudentAnswer {
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  question_index?: number;
  question_text?: string;
  selected_option_text?: string;
  selected_option_index?: number;
}

export interface Submission {
  id: string;
  quiz_id: string;
  student_name: string;
  student_class: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  tab_switch_count: number;
  started_at: string;
  completed_at: string;
  answers?: StudentAnswer[];
  answers_data?: StudentAnswer[];
}

