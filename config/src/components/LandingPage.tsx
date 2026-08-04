import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import heroImage from '../assets/images/proskill_academy_hero_1785485015179.jpg';
import {
  Sparkles,
  ArrowRight,
  LogIn,
  GraduationCap,
  ShieldCheck,
  Building2,
  Code2,
  Keyboard,
  Laptop,
  CheckCircle2,
  BookOpen,
  Award,
  Trophy,
  Flame,
  Swords
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setIsAuthModalOpen, setAuthModalMode, setActiveTab, user } = useAuth();

  // Interactive Typing Demo Simulation
  const demoText = "Pro Type — Sun'iy Intellekt va zamonaviy texnologiyalar yordamida klaviatura tezligi ile aniqligini oshiruvchi professional platforma!";
  const [typedIndex, setTypedIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTypedIndex(prev => (prev < demoText.length ? prev + 1 : 0));
    }, 90);
    return () => clearInterval(timer);
  }, []);

  // Main Single Kirish Button Handler
  const handleKirish = () => {
    if (user) {
      setActiveTab('mashq');
    } else {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background Ambient Glows & Grid Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center z-10 space-y-10">
        {/* Academy Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 border border-indigo-800/80 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-2xl backdrop-blur-xl animate-fadeIn">
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <span>PROSKILL IT ACADEMY • PRO TYPE PLATFORMASI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Co-Branding Title */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-amber-400 p-0.5 shadow-2xl shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 font-black text-2xl">
              PS
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              PROSKILL <span className="text-cyan-400">IT ACADEMY</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold tracking-wide">Professional AI Klaviatura Platformasi</p>
          </div>
        </div>

        {/* Main Hero Praise Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1] font-display">
          Klaviatura mahorati va zamonaviy IT kasblarni egallash uchun{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400">
            dunyodagi eng ilg'or AI platforma
          </span>
        </h1>

        {/* Descriptive Praising Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
          <strong className="text-cyan-400 font-semibold">Pro Type</strong> — real vaqt rejimida barmoq tezligi, Net WPM va aniqlikni baholovchi, AI botlar va onlayn foydalanuvchilar bilan poyga o'tkazuvchi, rasmiy muhrlangan sertifikatsiyani taqdim etuvchi mukammal IT tizim!
        </p>

        {/* EXACT CENTER SINGLE PREMIUM KIRISH BUTTON */}
        <div className="pt-4 flex items-center justify-center w-full">
          <button
            onClick={handleKirish}
            className="group relative px-12 py-6 rounded-3xl text-xl sm:text-2xl font-black text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:opacity-95 shadow-[0_0_50px_rgba(99,102,241,0.5)] hover:shadow-[0_0_70px_rgba(6,182,212,0.7)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 cursor-pointer"
          >
            <LogIn className="w-7 h-7 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>Kirish</span>
            <ArrowRight className="w-7 h-7 text-white group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="w-full max-w-4xl pt-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-left relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-bold text-slate-400 ml-2">ProType AI Live Typing Demo</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">120 WPM • 99.9% Aniqlik</span>
            </div>

            <div className="font-mono text-base sm:text-xl font-bold py-3 min-h-[70px] leading-relaxed">
              <span className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">
                {demoText.slice(0, typedIndex)}
              </span>
              <span className="inline-block w-2.5 h-6 bg-cyan-400 ml-0.5 animate-pulse" />
              <span className="text-slate-600">
                {demoText.slice(typedIndex)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH ACADEMY BUILDING HERO BACKGROUND SECTION */}
      <section className="relative w-full py-28 sm:py-36 overflow-hidden my-12 border-y border-slate-800 shadow-2xl">
        {/* Full width Parallax Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed filter brightness-90 transition-all duration-700"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/95 backdrop-blur-[2px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-lg">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Proskill IT Academy Binosi va O'quv Xonalari</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-display max-w-4xl mx-auto leading-tight">
            Zamonaviy kompyuterlar, yuqori tezlikdagi internet va xalqaro toifadagi mentorlar jamoasi
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Akademiyamizda har bir o'quvchi uchun individual kompyuter stansiyasi, qulay o'quv xonalari hamda eng so'nggi dasturlash va klaviatura mashg'ulotlari yaratilgan.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">1,200+</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Muvaffaqiyatli Bitiruvchilar</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">95%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Ishga Joylashish Ko'rsatkich</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Amaliy Mashg'ulotlar</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-violet-400 font-mono">№1</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Etalon IT Akademiya</div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES & PLATFORM FEATURES */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-bold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Proskill IT Academy O'quv Dasturlari</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-display">
            Bizning Asosiy Yo'nalishlarimiz
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Noldan professional darajagacha ta'lim oling. Har bir yo'nalish amaliy loyihalar va sertifikatlar bilan mustahkamlangan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-cyan-500 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Code2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Full-Stack Web Dasturlash</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              HTML, CSS, JavaScript, React, TypeScript, Node.js va Express yordamida zamonaviy veb-saytlar yaratishni o'rganing.
            </p>
            <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Davomiyligi: 8 oy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Real Portfolio Loyihalari</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/60 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-indigo-400 transition-all group ring-2 ring-indigo-500/20">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Keyboard className="w-7 h-7" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold uppercase">
              ProType Maxsus Kursi
            </div>
            <h3 className="text-xl font-bold text-white font-display">Shturm Klaviatura & Tezkor Yozuv</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Klaviatura ma'lumotlarini qaramasdan (blind typing) 80+ WPM tezlikda yozish va rasmiy ProType sertifikatini olish.
            </p>
            <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Davomiyligi: 1 oy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Rasmiy Muhrlangan Sertifikat</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-amber-500 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Laptop className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Python & Sun'iy Intellekt</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Python asoslari, Django, Sun'iy Intellekt modellarini integratsiya qilish va telegram botlar yaratish.
            </p>
            <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Davomiyligi: 6 oy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>AI Agent va Bot Yaratish</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Proskill IT Academy & ProType Platformasi. Barcha huquqlar ximoyalangan.</p>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Rasmiy Muhrlangan Sertifikatsiya Tizimi</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
