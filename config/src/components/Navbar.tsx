import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';
import { getUserAvatar } from '../utils/imageUtils';
import {
  GraduationCap,
  Keyboard,
  Swords,
  Trophy,
  Flame,
  BarChart3,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Zap,
  Menu,
  X,
  Crown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    logout
  } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Before login: Do NOT display navigation menu or dashboard buttons
  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.login === 'yy';

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'home', label: 'Bosh sahifa', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'mashq', label: 'Mashq qilish', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'jang', label: 'Jang', icon: <Swords className="w-4 h-4" /> },
    { id: 'musobaqalar', label: 'Musobaqalar', icon: <Trophy className="w-4 h-4" /> },
    { id: 'statistika', label: 'Statistika', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reyting', label: 'Reyting', icon: <Flame className="w-4 h-4" /> },
    { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin Panel', icon: <ShieldAlert className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <button
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-3 group focus:outline-none rounded-xl p-1 text-left shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xs text-cyan-400">
                PS
              </div>
            </div>
            <div className="flex flex-col text-left hidden xs:flex">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white font-display">
                  PROSKILL <span className="text-cyan-400">IT ACADEMY</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-cyan-300 bg-cyan-950 border border-cyan-800 rounded-full uppercase">
                  ProType
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wide font-medium">
                Rasmiy IT Ta'lim Platformasi
              </span>
            </div>
          </button>

          {/* Navigation Links - Desktop (XL & 2XL) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner overflow-x-auto max-w-4xl">
            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 scale-[1.02]'
                      : item.adminOnly
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile & Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Info */}
            <button
              onClick={() => handleSelectTab('profil')}
              className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {user.ism} {user.familiya}
                </span>
                <span className="text-[10px] font-medium text-emerald-400 flex items-center justify-end gap-1 font-mono">
                  <Zap className="w-2.5 h-2.5" />
                  {user.wpm_max || 0} WPM
                </span>
              </div>
              <div className="relative">
                <img
                  src={getUserAvatar(user.avatar, user.login)}
                  alt={user.ism}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/40 group-hover:ring-cyan-400 transition-all bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                {isAdmin && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm" title="Admin">
                    <Crown className="w-2.5 h-2.5 text-slate-950" />
                  </span>
                )}
              </div>
            </button>

            {/* Chiqish Button (Desktop & Tablet) */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Menyu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Medium Screen Horizontal Scroll Nav Bar (lg & md) */}
        <div className="hidden lg:flex xl:hidden py-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar items-center gap-1.5">
          {visibleNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : item.adminOnly
                    ? 'text-amber-400 bg-amber-950/30 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Drawer (sm & xs) */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-800/80 space-y-2 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleNavItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                        : item.adminOnly
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/80'
                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/50 border border-rose-900/60 mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
              <LogOut className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-display">Tizimdan Chiqish</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Siz rostdan ham tizimdan chiqmoqchimisiz?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 px-5 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
              >
                Yo'q
              </button>

              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Ha
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
