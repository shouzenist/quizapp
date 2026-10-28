// Teacher Authentication & Password Protection Helper (Supabase + Local Cache)
import { supabase, isSupabaseConfigured } from "./supabase";

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

/**
 * Sync latest teacher password from Supabase to local storage
 */
export async function syncTeacherPassword(): Promise<string> {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "teacher_password")
        .maybeSingle();

      if (!error && data?.value) {
        localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, data.value);
        return data.value;
      }
    } catch (err) {
      console.warn("Could not sync teacher password from Supabase:", err);
    }
  }

  return getTeacherPassword();
}

export async function loginTeacher(enteredPassword: string): Promise<boolean> {
  const clean = enteredPassword.trim();
  if (!clean) return false;

  // 1. Check local cache / fallback first
  const localPassword = getTeacherPassword();
  if (clean === localPassword) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
    }
    return true;
  }

  // 2. If doesn't match local cache, check Supabase directly (e.g. if password was changed on another device)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "teacher_password")
        .maybeSingle();

      if (!error && data?.value) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, data.value);
        }
        if (clean === data.value) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(STORAGE_AUTH_KEY, "true");
          }
          return true;
        }
      }
    } catch (err) {
      console.error("Error verifying password with database:", err);
    }
  }

  return false;
}

export function logoutTeacher(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
  }
}

export async function changeTeacherPassword(
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined") return { success: false, message: "Error" };

  const cleanNew = newPass.trim();
  if (!cleanNew || cleanNew.length < 4) {
    return { success: false, message: "Password baru minimal 4 karakter." };
  }

  // 1. Verify old password (check Supabase first if configured, else local)
  let currentPassword = getTeacherPassword();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "teacher_password")
        .maybeSingle();

      if (!error && data?.value) {
        currentPassword = data.value;
        localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, data.value);
      }
    } catch (err) {
      console.warn("Could not query current password from database:", err);
    }
  }

  if (oldPass !== currentPassword) {
    return { success: false, message: "Password lama tidak sesuai." };
  }

  // 2. Save new password to Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: "teacher_password",
            value: cleanNew,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) {
        console.error("Gagal simpan ke Supabase app_settings:", error);
        localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, cleanNew);
        return {
          success: true,
          message: "Password tersimpan lokal (Tabel app_settings di Supabase belum ada. Jalankan SQL yang disediakan).",
        };
      }
    } catch (err) {
      console.error("Error updating password in Supabase:", err);
      localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, cleanNew);
      return {
        success: true,
        message: "Password tersimpan lokal (Gagal koneksi ke database).",
      };
    }
  }

  // 3. Save to local storage cache
  localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, cleanNew);
  return {
    success: true,
    message: "Password guru berhasil diperbarui dan disinkronkan ke semua perangkat!",
  };
}
