import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User as UserIcon, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register
  } = useAuth();

  const [loginInput, setLoginInput] = useState('');
  const [ismInput, setIsmInput] = useState('');
  const [familiyaInput, setFamiliyaInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authModalMode === 'login') {
      if (!loginInput.trim() || !passwordInput) {
        setErrorMessage("Iltimos, login va parolni kiriting.");
        return;
      }

      setIsLoading(true);
      const res = await login(loginInput.trim(), passwordInput);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || "Tizimga kirishda xatolik yuz berdi.");
      }
    } else {
      // Registration
      if (!loginInput.trim() || !ismInput.trim() || !familiyaInput.trim() || !passwordInput) {
        setErrorMessage("Iltimos, barcha maydonlarni to'ldiring.");
        return;
      }

      if (passwordInput !== confirmPasswordInput) {
        setErrorMessage("Parollar mos kelmadi. Qayta tekshiring.");
        return;
      }

      if (passwordInput.length < 3) {
        setErrorMessage("Parol kamida 3 ta belgidan iborat bo'lishi kerak.");
        return;
      }

      setIsLoading(true);
      const res = await register({
        login: loginInput.trim(),
        ism: ismInput.trim(),
        familiya: familiyaInput.trim(),
        password: passwordInput,
      });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro Type Platformasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            {authModalMode === 'login' ? "Tizimga kirish" : "Ro'yxatdan o'tish"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {authModalMode === 'login'
              ? "Klaviatura mashqlari va musobaqalarda qatnashish uchun kiring"
              : "Yangi hisob yarating va o'z statistikangizni kuzatib boring"}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              authModalMode === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              authModalMode === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs sm:text-sm rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Login
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                placeholder="masalan: alisher yoki jasur"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Registration Extra Fields */}
          {authModalMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ism
                  </label>
                  <input
                    type="text"
                    value={ismInput}
                    onChange={e => setIsmInput(e.target.value)}
                    placeholder="Sizning ismingiz"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Familiya
                  </label>
                  <input
                    type="text"
                    value={familiyaInput}
                    onChange={e => setFamiliyaInput(e.target.value)}
                    placeholder="Sizning familiyangiz"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Parolni tasdiqlash
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={e => setConfirmPasswordInput(e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:opacity-95 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{authModalMode === 'login' ? "KIRISH" : "RO'YXATDAN O'TISH"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
