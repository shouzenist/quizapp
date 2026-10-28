"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Settings,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import {
  isTeacherLoggedIn,
  loginTeacher,
  logoutTeacher,
  changeTeacherPassword,
  syncTeacherPassword,
} from "@/lib/teacherAuth";
import { sounds } from "@/lib/sound";

export default function TeacherAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Change password modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isTeacherLoggedIn());
    syncTeacherPassword();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoggingIn(true);

    try {
      const success = await loginTeacher(password);
      if (success) {
        sounds.playCorrect();
        setIsAuthenticated(true);
        setPassword("");
      } else {
        sounds.playWrong();
        setErrorMsg("Password salah! Silakan periksa kembali atau gunakan default: guru123");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat memeriksa password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sounds.playSelect();
    logoutTeacher();
    setIsAuthenticated(false);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);
    setIsSavingPass(true);

    try {
      const res = await changeTeacherPassword(oldPassword, newPassword);
      if (res.success) {
        sounds.playCorrect();
        setSettingsMsg({ type: "success", text: res.message });
        setOldPassword("");
        setNewPassword("");
        setTimeout(() => setShowSettingsModal(false), 2000);
      } else {
        sounds.playWrong();
        setSettingsMsg({ type: "error", text: res.message });
      }
    } catch {
      setSettingsMsg({ type: "error", text: "Terjadi kesalahan saat menyimpan password." });
    } finally {
      setIsSavingPass(false);
    }
  };

  // Initial loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Memeriksa izin akses...</p>
      </div>
    );
  }

  // If Not Authenticated -> Show Locked Screen
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full">
        <div className="w-full max-w-md glass-card rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 bg-white text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Portal Guru Terkunci
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 mb-6">
            Menu ini khusus untuk guru pengajar. Silakan masukkan password untuk mengakses pembuatan soal dan rekap nilai.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password Guru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Masukkan password guru..."
                  className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMsg ? (
                <p className="text-xs text-rose-500 font-medium mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-2">
                  Password bawaan awal: <strong className="text-slate-700 font-mono">guru123</strong> (dapat diubah nanti)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 hover:from-blue-950 hover:via-blue-800 hover:to-sky-600 shadow-md shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Buka Portal Guru</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link
              href="/"
              onClick={() => sounds.playSelect()}
              className="text-xs text-slate-500 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Murid</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If Authenticated -> Render Portal with Teacher Toolbar
  return (
    <div className="flex-1 flex flex-col">
      {/* Teacher Session Subheader */}
      <div className="bg-blue-950 text-white text-xs py-1.5 px-4 border-b border-blue-900">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-blue-100">Sesi Guru Aktif</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playSelect();
                setShowSettingsModal(true);
                setSettingsMsg(null);
              }}
              className="hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer font-medium text-blue-200"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ubah Password</span>
            </button>

            <span className="text-blue-400">•</span>

            <button
              onClick={handleLogout}
              className="hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer font-medium text-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci / Logout</span>
            </button>
          </div>
        </div>
      </div>

      {children}

      {/* Change Password Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-700" />
              <span>Ubah Password Guru</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Gunakan password baru yang mudah Anda ingat.
            </p>

            {settingsMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  settingsMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {settingsMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{settingsMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password Lama
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password Baru (Min 4 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingPass ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
