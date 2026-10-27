// Teacher Authentication & Password Protection Helper

const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD || "guru123";
const STORAGE_AUTH_KEY = "quizapp_teacher_auth_token";
const STORAGE_CUSTOM_PIN_KEY = "quizapp_teacher_custom_pin";

export function getTeacherPassword(): string {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;
  return localStorage.getItem(STORAGE_CUSTOM_PIN_KEY) || DEFAULT_PASSWORD;
}

export function isTeacherLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_AUTH_KEY) === "true";
}

export function loginTeacher(enteredPassword: string): boolean {
  const currentPassword = getTeacherPassword();
  if (enteredPassword.trim() === currentPassword) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
    }
    return true;
  }
  return false;
}

export function logoutTeacher(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
  }
}

export function changeTeacherPassword(oldPass: string, newPass: string): { success: boolean; message: string } {
  if (typeof window === "undefined") return { success: false, message: "Error" };
  const current = getTeacherPassword();
  if (oldPass !== current) {
    return { success: false, message: "Password lama tidak sesuai." };
  }
  if (!newPass || newPass.trim().length < 4) {
    return { success: false, message: "Password baru minimal 4 karakter." };
  }
  localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, newPass.trim());
  return { success: true, message: "Password guru berhasil diperbarui!" };
}
