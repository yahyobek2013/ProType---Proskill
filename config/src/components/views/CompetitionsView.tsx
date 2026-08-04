import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Competition, CompetitionParticipant } from '../../types';
import { soundManager } from '../../utils/sound';
import confetti from 'canvas-confetti';
import { CertificateCard } from '../CertificateCard';
import { CertificateData } from '../../utils/pdfGenerator';
import { CompetitionResultReportCard } from '../CompetitionResultReportCard';
import {
  Trophy,
  Users,
  Clock,
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  Gift,
  Award,
  AlertCircle,
  Globe,
  ArrowLeft,
  Download,
  Eye,
  Check,
  X,
  Target,
  BarChart2,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const CompetitionsView: React.FC = () => {
  const { user } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('active');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Competition Modal & Flow State
  // modalStep: 'info' | 'already_participated' | 'racing' | 'result' | null
  const [modalStep, setModalStep] = useState<'info' | 'already_participated' | 'racing' | 'result' | null>(null);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);

  // Live Typing State
  const [userInput, setUserInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Timer & Real-time Stats
  const [durationSec, setDurationSec] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

  const [wpm, setWpm] = useState<number>(0);
  const [netWpm, setNetWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [cpm, setCpm] = useState<number>(0);
  const [errors, setErrors] = useState<number>(0);
  const [correctChars, setCorrectChars] = useState<number>(0);
  const [incorrectChars, setIncorrectChars] = useState<number>(0);
  const [completionTimeSec, setCompletionTimeSec] = useState<number>(0);

  // Submitted / Saved Result Details
  const [myParticipantResult, setMyParticipantResult] = useState<CompetitionParticipant | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [rank, setRank] = useState<number>(1);
  const [ratingPoints, setRatingPoints] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const serverOffsetRef = useRef<number>(0);

  // Fetch Server Time
  const fetchServerTime = async (): Promise<number> => {
    try {
      const res = await fetch('/api/server-time');
      if (res.ok) {
        const data = await res.json();
        const serverTimestamp = data.timestamp;
        const localNow = Date.now();
        serverOffsetRef.current = serverTimestamp - localNow;
        return serverTimestamp;
      }
    } catch (err) {
      console.error("Server time fetch error:", err);
    }
    return Date.now();
  };

  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/competitions');
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data);
        return data;
      }
    } catch (err) {
      console.error("Fetch competitions error:", err);
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  useEffect(() => {
    fetchServerTime().then(() => {
      fetchCompetitions();
    });
  }, [user?.id]);

  // Click "Join Competition" / "Musobaqada Qatnashish"
  const handleOpenCompeteModal = (comp: Competition) => {
    setActiveComp(comp);

    // Check if user has already participated
    const existing = comp.participants.find(p => p.user_id === user?.id);
    if (existing) {
      setMyParticipantResult(existing);
      setRank(existing.rank || comp.participants.indexOf(existing) + 1);
      setRatingPoints(comp.reward_points || 50);

      // Create cert structure for PDF viewing
      setCertificateData({
        id: `PSAK-COMP-${comp.id.slice(0, 4).toUpperCase()}-${String(user?.id || '0').padStart(4, '0')}`,
        user_id: user?.id || '',
        user_name: existing.user_name,
        login: user?.login || '',
        user_avatar: existing.avatar,
        wpm: existing.wpm,
        net_wpm: existing.net_wpm || Math.round(existing.wpm * (existing.accuracy / 100)),
        accuracy: existing.accuracy,
        test_type: `Musobaqa: ${comp.title}`,
        date: existing.joined_at ? existing.joined_at.split('T')[0] : new Date().toISOString().split('T')[0]
      });

      setModalStep('already_participated');
    } else {
      setModalStep('info');
    }
  };

  // User clicks "Start" inside the Information Modal
  const handleStartRacing = async () => {
    if (!activeComp) return;

    // Double check database protection on frontend
    const existing = activeComp.participants.find(p => p.user_id === user?.id);
    if (existing) {
      setModalStep('already_participated');
      return;
    }

    const serverNow = await fetchServerTime();
    const duration = activeComp.duration || 60;
    const end = serverNow + duration * 1000;

    setUserInput('');
    setDurationSec(duration);
    setTimeLeft(duration);
    setStartTimeMs(serverNow);
    setEndTimeMs(end);

    setWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setCpm(0);
    setErrors(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setCompletionTimeSec(0);

    setModalStep('racing');
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  // Synchronized countdown timer during racing
  useEffect(() => {
    if (modalStep !== 'racing' || !endTimeMs) return;

    const interval = setInterval(() => {
      const nowServer = Date.now() + serverOffsetRef.current;
      const remainingMs = Math.max(0, endTimeMs - nowServer);
      const remainingSec = Math.ceil(remainingMs / 1000);

      setTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        clearInterval(interval);
        finishCompetition();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [modalStep, endTimeMs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeComp || modalStep !== 'racing' || timeLeft <= 0) return;
    const val = e.target.value;

    soundManager.playKeyPress(val.endsWith(' '));
    setUserInput(val);

    let errCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== activeComp.text[i]) {
        errCount++;
      }
    }
    const correctCount = Math.max(0, val.length - errCount);
    setErrors(errCount);
    setCorrectChars(correctCount);
    setIncorrectChars(errCount);

    const nowServer = Date.now() + serverOffsetRef.current;
    const start = startTimeMs || nowServer;
    const elapsedSec = Math.max(0.5, (nowServer - start) / 1000);
    const elapsedMin = elapsedSec / 60;

    const calcWpm = Math.round((correctCount / 5) / elapsedMin);
    const calcNetWpm = Math.max(0, Math.round(calcWpm - (errCount / elapsedMin)));
    const calcCpm = Math.round(correctCount / elapsedMin);
    const calcAcc = val.length > 0 ? Math.round((correctCount / val.length) * 100) : 100;

    setWpm(calcWpm);
    setNetWpm(calcNetWpm);
    setCpm(calcCpm);
    setAccuracy(calcAcc);

    if (val === activeComp.text || val.length >= activeComp.text.length) {
      finishCompetition(calcWpm, calcAcc, calcNetWpm, calcCpm, errCount, correctCount, Math.round(elapsedSec));
    }
  };

  const finishCompetition = (
    finalWpm = wpm,
    finalAcc = accuracy,
    finalNetWpm = netWpm,
    finalCpm = cpm,
    finalErrors = errors,
    finalCorrect = correctChars,
    finalElapsedSec = durationSec - timeLeft
  ) => {
    if (modalStep === 'result' || isSubmitting) return;

    soundManager.playSuccess();
    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    } catch (e) {
      // Ignore
    }

    const compTime = finalElapsedSec || durationSec;
    setCompletionTimeSec(compTime);
    setModalStep('result');

    submitCompetitionScore(finalWpm, finalAcc, finalNetWpm, finalCpm, finalErrors, finalCorrect, finalErrors, compTime);
  };

  const submitCompetitionScore = async (
    finalWpm: number,
    finalAcc: number,
    finalNetWpm: number,
    finalCpm: number,
    finalErrors: number,
    finalCorrect: number,
    finalIncorrect: number,
    compTime: number
  ) => {
    if (!activeComp || !user) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/competitions/${activeComp.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          wpm: finalWpm,
          accuracy: finalAcc,
          netWpm: finalNetWpm,
          cpm: finalCpm,
          errors: finalErrors,
          correctChars: finalCorrect,
          incorrectChars: finalIncorrect,
          completionTime: compTime
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.participant) setMyParticipantResult(data.participant);
        if (data.certificate) setCertificateData(data.certificate);
        if (data.rank) setRank(data.rank);
        if (data.ratingPoints) setRatingPoints(data.ratingPoints);

        if (data.competition) {
          setActiveComp(data.competition);
        }
        fetchCompetitions();
      } else {
        const errData = await res.json();
        if (errData.alreadyParticipated) {
          if (errData.participant) setMyParticipantResult(errData.participant);
          setModalStep('already_participated');
        }
      }
    } catch (err) {
      console.error("Submit competition score error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalStep(null);
    setActiveComp(null);
    setUserInput('');
  };

  const viewMyResultFromBlockedScreen = () => {
    setModalStep('result');
  };

  const filtered = competitions.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Competitions Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">Rasmiy Musobaqalar</h2>
            <p className="text-xs text-slate-400">Professional platformada rasmiy reyting ballari va qimmatbaho sertifikatlar uchun bellashing</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'active' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Faol Musobaqalar
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'finished' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Yakunlangan
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* Competitions Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-sm font-semibold">Musobaqalar tizimdan yuklanmoqda...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <Trophy className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white">Musobaqalar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1">Hozirda tanlangan kategoriyada musobaqalar mavjud emas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(comp => {
            const isActive = comp.status === 'active';
            const userParticipation = comp.participants.find(p => p.user_id === user?.id);

            return (
              <div
                key={comp.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-6 transition-all hover:shadow-2xl hover:shadow-amber-500/5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isActive ? "● Faol Musobaqa" : "Yakunlangan"}
                    </span>

                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/80">
                      <Gift className="w-3.5 h-3.5" />
                      <span>+{comp.reward_points} Ball</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white font-display">{comp.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1.5 line-clamp-2">{comp.description}</p>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span><strong>{comp.participants.length}</strong> ishtirokchi</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span><strong>{comp.duration || 60}</strong> soniya</span>
                    </span>
                  </div>

                  {/* Leaderboard Preview */}
                  {comp.participants.length > 0 && (
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">#1</span>
                        <span className="text-xs font-semibold text-slate-200">{comp.participants[0].user_name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{comp.participants[0].wpm} WPM</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {isActive ? (
                    <button
                      onClick={() => handleOpenCompeteModal(comp)}
                      className={`w-full py-4 px-4 rounded-2xl font-black text-sm text-slate-950 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userParticipation
                          ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 hover:opacity-95 shadow-cyan-500/20'
                          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:opacity-95 shadow-amber-500/25'
                      }`}
                    >
                      {userParticipation ? (
                        <>
                          <Eye className="w-4 h-4 fill-current" />
                          <span>Natijani Ko'rish</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Musobaqada Qatnashish</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center py-3 text-xs font-bold text-slate-500 bg-slate-950 rounded-2xl">
                      Musobaqa yakunlangan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SYSTEM */}
      {modalStep && activeComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">

            {/* STEP 1: COMPETITION START SCREEN (INFORMATION MODAL) */}
            {modalStep === 'info' && (
              <div className="space-y-6 text-center animate-fadeIn">
                <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-3xl p-0.5 mx-auto shadow-2xl shadow-amber-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400">
                    <Trophy className="w-10 h-10" />
                  </div>
                </div>

                <div>
                  <span className="px-3.5 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    Musobaqa Ma'lumotlari
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-display mt-2">{activeComp.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
                    {activeComp.description}
                  </p>
                </div>

                {/* Competition Details Cards */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Davomiylik
                    </span>
                    <strong className="text-base sm:text-lg font-black text-white font-mono block">
                      {activeComp.duration || 60} soniya
                    </strong>
                  </div>

                  <div className="space-y-1 border-x border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      Til
                    </span>
                    <strong className="text-base sm:text-lg font-black text-white font-mono block">
                      O'zbekcha
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Ishtirokchilar
                    </span>
                    <strong className="text-base sm:text-lg font-black text-white font-mono block">
                      {activeComp.participants.length} kishi
                    </strong>
                  </div>
                </div>

                {/* One Attempt Warning Notice */}
                <div className="bg-amber-950/40 border border-amber-800/80 p-3.5 rounded-2xl text-xs text-amber-300 flex items-center gap-3 text-left">
                  <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>Diqqat!</strong> Har bir foydalanuvchi musobaqada <strong>faqat 1 marta</strong> qatnashish imkoniyatiga ega. "Boshlash" tugmasini bosishingiz bilan vaqt sanog'i ishga tushadi.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-400 bg-slate-800 hover:text-white transition-all cursor-pointer"
                  >
                    Bekor qilish
                  </button>

                  <button
                    onClick={handleStartRacing}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:opacity-95 shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Musobaqani Boshlash</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ONE ATTEMPT ONLY (BLOCKED SCREEN IF ALREADY PARTICIPATED) */}
            {modalStep === 'already_participated' && (
              <div className="space-y-6 text-center animate-fadeIn py-4">
                <div className="w-20 h-20 bg-rose-950 border-2 border-rose-800 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <ShieldAlert className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                    Taqiqlandi / Faqat 1 marta
                  </span>
                  <h2 className="text-2xl font-black text-white font-display">
                    Siz ushbu musobaqada allaqachon qatnashgansiz.
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You have already participated in this competition. Adolatli bellashuv qoidalariga ko'ra, har bir ishtirokchiga 1 marta imkoniyat beriladi.
                  </p>
                </div>

                {/* Display previous result summary */}
                {myParticipantResult && (
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center max-w-md mx-auto">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Sizning WPM</span>
                      <strong className="text-xl font-black text-amber-400 font-mono">{myParticipantResult.wpm}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Aniqlik</span>
                      <strong className="text-xl font-black text-emerald-400 font-mono">{myParticipantResult.accuracy}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">O'rningiz</span>
                      <strong className="text-xl font-black text-cyan-400 font-mono">#{rank}</strong>
                    </div>
                  </div>
                )}

                {/* EXACT REQUIRED BUTTONS: View My Result & Back to Home */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={viewMyResultFromBlockedScreen}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:opacity-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Natijamni ko'rish</span>
                  </button>

                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Bosh sahifaga qaytish</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: LIVE TYPING COMPETITION */}
            {modalStep === 'racing' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center font-bold">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">{activeComp.title}</h3>
                      <p className="text-xs text-slate-400">Musobaqa matnini imkon qadar tez va xatosiz yozing</p>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold transition-all"
                  >
                    Yopish
                  </button>
                </div>

                {/* Countdown Timer Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span className="text-xs font-bold text-slate-400 uppercase">Qolgan vaqt:</span>
                    </div>

                    <div className={`px-4 py-1.5 rounded-xl font-mono text-xl font-black transition-all ${
                      timeLeft <= 10
                        ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-bounce'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        timeLeft <= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (timeLeft / durationSec) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Text Input Box */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="bg-slate-950 p-6 rounded-2xl border border-slate-800 cursor-text space-y-4"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInputChange}
                    className="absolute opacity-0 pointer-events-none"
                    autoFocus
                  />

                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block">WPM</span>
                      <strong className="text-amber-400 text-base">{wpm}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Net WPM</span>
                      <strong className="text-cyan-400 text-base">{netWpm}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Aniqlik</span>
                      <strong className="text-emerald-400 text-base">{accuracy}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Xatolar</span>
                      <strong className="text-rose-400 text-base">{errors}</strong>
                    </div>
                  </div>

                  <div className="font-mono text-base sm:text-lg leading-relaxed select-none max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    {activeComp.text.split('').map((char, idx) => {
                      let cls = 'text-slate-500';
                      if (idx < userInput.length) {
                        cls = userInput[idx] === char ? 'text-emerald-400 font-bold' : 'text-rose-400 bg-rose-950 font-bold';
                      } else if (idx === userInput.length) {
                        cls = 'text-white bg-amber-500 rounded px-0.5 animate-pulse';
                      }
                      return <span key={idx} className={cls}>{char}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 & 5: DETAILED RESULTS PAGE */}
            {modalStep === 'result' && activeComp && (
              <CompetitionResultReportCard
                user={user}
                competition={activeComp}
                rank={rank || myParticipantResult?.rank || 1}
                wpm={wpm || myParticipantResult?.wpm || 0}
                netWpm={netWpm || myParticipantResult?.net_wpm || Math.round((wpm || myParticipantResult?.wpm || 0) * ((accuracy || myParticipantResult?.accuracy || 100) / 100))}
                accuracy={accuracy || myParticipantResult?.accuracy || 100}
                errors={errors || myParticipantResult?.errors || 0}
                correctChars={correctChars || myParticipantResult?.correct_chars || Math.round((wpm || myParticipantResult?.wpm || 0) * 5)}
                incorrectChars={incorrectChars || myParticipantResult?.incorrect_chars || errors || 0}
                ratingPoints={ratingPoints || activeComp.reward_points || 50}
                duration={completionTimeSec || activeComp.duration || 60}
                onReturnHome={closeModal}
                onViewLeaderboard={() => setModalStep('info')}
              />
            )}

          </div>
        </div>
      )}
    </div>
  );
};
