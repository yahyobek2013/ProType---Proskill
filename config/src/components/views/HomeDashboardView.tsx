import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';
import { getUserAvatar } from '../../utils/imageUtils';
import {
  Keyboard,
  Swords,
  Trophy,
  Flame,
  BarChart3,
  User as UserIcon,
  ShieldAlert,
  Zap,
  Target,
  CheckCircle2,
  Crown,
  ArrowRight,
  Sparkles,
  Medal
} from 'lucide-react';

export const HomeDashboardView: React.FC = () => {
  const { user, setActiveTab } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin' || user.login === 'yy';

  const quickActions: {
    id: ActiveTab;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'mashq',
      title: "Mashq Qilish",
      desc: "O'zbekcha matnlar va simvollar ustida klaviatura mashg'uloti",
      icon: <Keyboard className="w-6 h-6 text-cyan-400" />,
      color: "from-cyan-950/60 to-slate-900 border-cyan-800/80 hover:border-cyan-500",
      badge: "Mashhur"
    },
    {
      id: 'jang',
      title: "Poyga va Jang",
      desc: "AI botlar va onlayn foydalanuvchilar bilan real vaqtda poygalashing",
      icon: <Swords className="w-6 h-6 text-indigo-400" />,
      color: "from-indigo-950/60 to-slate-900 border-indigo-800/80 hover:border-indigo-500",
      badge: "Jonli"
    },
    {
      id: 'musobaqalar',
      title: "Rasmiy Musobaqalar",
      desc: "Haftalik sovrinli musobaqalarda qatnashib reyting ballarini yutib oling",
      icon: <Trophy className="w-6 h-6 text-amber-400" />,
      color: "from-amber-950/60 to-slate-900 border-amber-800/80 hover:border-amber-500",
      badge: "Sovrinli"
    },
    {
      id: 'statistika',
      title: "Shaxsiy Statistika",
      desc: "WPM dinamikasi, aniqlik grafiklari va natijalar tahlili",
      icon: <BarChart3 className="w-6 h-6 text-teal-400" />,
      color: "from-teal-950/60 to-slate-900 border-teal-800/80 hover:border-teal-500"
    },
    {
      id: 'reyting',
      title: "Platforma Reytingi",
      desc: "Eng tezkor klaviatura ustalari va Top-100 talik peshqadamlar jadvali",
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      color: "from-rose-950/60 to-slate-900 border-rose-800/80 hover:border-rose-500"
    },
    {
      id: 'profil',
      title: "Mening Profilim",
      desc: "Shaxsiy ma'lumotlar, nishonlar va erishilgan sertifikatlarni ko'rish",
      icon: <UserIcon className="w-6 h-6 text-blue-400" />,
      color: "from-blue-950/60 to-slate-900 border-blue-800/80 hover:border-blue-500"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Hero Dashboard Card */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 z-10">
          <div className="relative shrink-0">
            <img
              src={getUserAvatar(user.avatar, user.login)}
              alt={user.ism}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-indigo-500/40 shadow-xl bg-slate-800"
            />
            {isAdmin && (
              <span className="absolute -bottom-2 -right-2 p-1.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg" title="Administrator">
                <Crown className="w-4 h-4 fill-slate-950" />
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-cyan-300 text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAdmin ? 'Administrator Boshqaruv Paneli' : 'Tizimga Kirilgan'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
              Xush kelibsiz, {user.ism} {user.familiya}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              bugungi klaviatura mashg'ulotingizni boshlang va WPM natijangizni yaxshilang!
            </p>
          </div>
        </div>

        {/* Quick User Metric Stat Pills */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto z-10">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Max WPM</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{user.wpm_max || 0}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Aniqlik</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{user.accuracy_avg || 100}%</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Testlar</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{user.tests_completed || 0}</span>
          </div>
        </div>
      </div>

      {/* Admin Panel Special Banner (for Admin) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-800/80 p-5 rounded-3xl shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Administrator Huquqlari Faol</h3>
              <p className="text-xs text-slate-400">Foydalanuvchilarni tahrirlash, o'chirish va musobaqalarni boshqarish</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('admin')}
            className="px-5 py-2.5 rounded-2xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Admin Panelga O'tish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dashboard Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
          <span>Platforma Imkoniyatlari va Bo'limlar</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => setActiveTab(action.id)}
              className={`bg-gradient-to-br ${action.color} border rounded-3xl p-5 text-left transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between group cursor-pointer space-y-4`}
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                {action.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 border border-slate-800 text-cyan-300">
                    {action.badge}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>{action.title}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Badges & Achievements Section */}
      {user.badges && user.badges.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            <span>Erishilgan Nishonlar va Unvonlar</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-300 flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
