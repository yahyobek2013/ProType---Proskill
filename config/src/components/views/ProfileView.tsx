import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CertificateCard } from '../CertificateCard';
import { CertificateData } from '../../utils/pdfGenerator';
import { getUserAvatar } from '../../utils/imageUtils';
import {
  User as UserIcon,
  Upload,
  Save,
  Award,
  Zap,
  Loader2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [ism, setIsm] = useState(user?.ism || '');
  const [familiya, setFamiliya] = useState(user?.familiya || '');
  const [loginStr, setLoginStr] = useState(user?.login || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState<boolean>(true);

  const fetchCertificates = async () => {
    if (!user) return;
    setIsLoadingCerts(true);
    try {
      const res = await fetch(`/api/certificates/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, CertificateData>();
        data.forEach((c: CertificateData) => {
          if (c && c.id) map.set(c.id, c);
        });
        setCertificates(Array.from(map.values()));
      }
    } catch (err) {
      console.error("Fetch certificates error:", err);
    } finally {
      setIsLoadingCerts(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsm(user.ism || '');
      setFamiliya(user.familiya || '');
      setLoginStr(user.login || '');
      setAvatar(user.avatar || '');
      fetchCertificates();
    }
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setIsUploadingAvatar(true);

    const res = await uploadAvatar(file);
    setIsUploadingAvatar(false);

    if (res.success && res.avatar) {
      setAvatar(res.avatar);
      setMessage({ type: 'success', text: "Profil rasmi muvaffaqiyatli saqlandi." });
    } else {
      setMessage({ type: 'error', text: res.error || "Profil rasmini saqlashda xatolik" });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const updatePayload: any = {
      ism,
      familiya,
      login: loginStr,
      avatar
    };

    if (password.trim().length > 0) {
      updatePayload.password = password.trim();
    }

    const res = await updateProfile(updatePayload);
    setIsSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: "Profil ma'lumotlari muvaffaqiyatli saqlandi!" });
      setPassword('');
      fetchCertificates();
    } else {
      setMessage({ type: 'error', text: res.error || "Profilni saqlashda xatolik" });
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-400">
        Tizimga kirmagansiz. Iltimos, avval kirish tugmasini bosing.
      </div>
    );
  }

  // Fallback default certificate if user has stats but array is empty
  const defaultCert: CertificateData = {
    id: `PSAK-2026-${String(user.id).padStart(6, '0')}`,
    user_id: user.id,
    user_name: `${user.ism} ${user.familiya}`,
    login: user.login,
    user_avatar: user.avatar,
    wpm: user.wpm_max || 45,
    net_wpm: Math.max(0, Math.round((user.wpm_max || 45) * ((user.accuracy_avg || 98) / 100))),
    accuracy: user.accuracy_avg || 98.5,
    test_type: "Rasmiy Sertifikat Imtihoni",
    date: new Date().toISOString().split('T')[0],
  };

  const certList = useMemo(() => {
    const rawList = certificates.length > 0 ? certificates : [defaultCert];
    const map = new Map<string, CertificateData>();
    rawList.forEach(c => {
      if (c && c.id) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [certificates, user?.id, user?.ism, user?.familiya, user?.login, user?.wpm_max, user?.accuracy_avg]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            <img
              src={getUserAvatar(user.avatar || avatar, user.login)}
              alt={user.ism}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-indigo-500/50 shadow-xl bg-slate-800"
              referrerPolicy="no-referrer"
            />
            <label className="absolute inset-0 bg-slate-950/75 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1 p-2 text-center">
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span>Rasm Almashtirish</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white font-display">{user.ism} {user.familiya}</h2>
              {user.role === 'admin' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold">
                  ★ Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">@{user.login}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                {user.wpm_max} WPM Max
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
                {user.accuracy_avg}% Aniqlik
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-400 text-xs font-bold flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>{certList.length} ta Sertifikat</span>
          </span>
        </div>
      </div>

      {/* Edit Information Form */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 print:hidden">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <UserIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white font-display">Profil Ma'lumotlarini Tahrirlash</h3>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold ${
            message.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ism</label>
              <input
                type="text"
                value={ism}
                onChange={e => setIsm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Familiya</label>
              <input
                type="text"
                value={familiya}
                onChange={e => setFamiliya(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Login</label>
              <input
                type="text"
                value={loginStr}
                onChange={e => setLoginStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Yangi Parol (ixtiyoriy)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saqlanmoqda..." : "Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* EARNED CERTIFICATES SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white font-display">Qolga Kiritilgan Sertifikatlar</h3>
          </div>
          <span className="text-xs text-slate-400">
            Jami: <strong className="text-amber-400 font-bold">{certList.length} ta sertifikat</strong>
          </span>
        </div>

        {isLoadingCerts ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
            <span>Sertifikatlar yuklanmoqda...</span>
          </div>
        ) : (
          <div className="space-y-12">
            {certList.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                userAvatar={user.avatar}
                showDownloadButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
