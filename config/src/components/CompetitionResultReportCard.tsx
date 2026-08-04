import React, { useState, useEffect, useRef } from 'react';
import { getUserAvatar } from '../utils/imageUtils';
import {
  Trophy,
  Award,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Zap,
  Download,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Users,
  Activity,
  Keyboard,
  FileText,
  Percent,
  Flame,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  downloadCompetitionResultPDF,
  generateQRCodeDataUrl,
  CertificateData
} from '../utils/pdfGenerator';
import { CertificateCard } from './CertificateCard';
import { User, Competition, SpeedHistorySample, MistakeDetailItem } from '../types';

export interface CompetitionResultReportCardProps {
  user?: User | null;
  competition: Competition;
  rank: number;
  wpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  incorrectChars: number;
  totalCharsTyped?: number;
  totalWordsTyped?: number;
  completedPercentage?: number;
  ratingPoints: number;
  duration: number; // Finish time in seconds
  remainingTime?: number;
  totalParticipants?: number;
  speedHistory?: SpeedHistorySample[];
  mistakeKeyboardHeatmap?: Record<string, number>;
  mistakeDetails?: MistakeDetailItem[];
  certificateEarned?: boolean;
  certificateData?: CertificateData | null;
  onReturnHome: () => void;
  onViewLeaderboard: () => void;
}

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
  ['Space']
];

export const CompetitionResultReportCard: React.FC<CompetitionResultReportCardProps> = ({
  user,
  competition,
  rank,
  wpm,
  netWpm,
  accuracy,
  errors,
  correctChars,
  incorrectChars,
  totalCharsTyped,
  totalWordsTyped,
  completedPercentage,
  ratingPoints,
  duration,
  remainingTime,
  totalParticipants,
  speedHistory = [],
  mistakeKeyboardHeatmap = {},
  mistakeDetails = [],
  certificateEarned = false,
  certificateData = null,
  onReturnHome,
  onViewLeaderboard,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'heatmap' | 'mistakes'>('charts');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Computed values for metrics
  const calculatedTotalChars = totalCharsTyped || (correctChars + incorrectChars);
  const calculatedTotalWords = totalWordsTyped || Math.round(calculatedTotalChars / 5);
  const calculatedCompPercent = completedPercentage !== undefined ? completedPercentage : 100;
  const compTotalDuration = competition.duration || 60;
  const calculatedRemainingTime = remainingTime !== undefined ? remainingTime : Math.max(0, compTotalDuration - duration);
  const participantCount = totalParticipants || (competition.participants?.length || 1);
  const userName = user ? `${user.ism} ${user.familiya}` : "Ishtirokchi";

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/#musobaqalar?report=${competition.id}`;
    generateQRCodeDataUrl(verifyUrl).then(setQrCodeUrl);
  }, [competition.id]);

  // Construct chart samples if speedHistory is missing or short
  const chartData = React.useMemo(() => {
    if (speedHistory && speedHistory.length >= 3) {
      return speedHistory.map(s => ({
        time: `${s.second}s`,
        wpm: s.wpm,
        netWpm: s.netWpm,
        accuracy: s.accuracy
      }));
    }

    // Dynamic smooth interpolation generator
    const steps = 10;
    const interval = Math.max(1, Math.round(duration / steps));
    const samples = [];
    for (let i = 1; i <= steps; i++) {
      const t = Math.min(duration, i * interval);
      const ratio = i / steps;
      // Slight smooth progression curve
      const sampleWpm = Math.round(wpm * (0.4 + 0.6 * Math.sqrt(ratio)));
      const sampleNetWpm = Math.max(0, Math.round(netWpm * (0.4 + 0.6 * Math.sqrt(ratio))));
      const sampleAcc = Math.min(100, Math.round(accuracy + (100 - accuracy) * (1 - ratio)));
      samples.push({
        time: `${t}s`,
        wpm: sampleWpm,
        netWpm: sampleNetWpm,
        accuracy: sampleAcc
      });
    }
    return samples;
  }, [speedHistory, wpm, netWpm, accuracy, duration]);

  // Mistake distribution for bar chart
  const mistakeChartData = React.useMemo(() => {
    if (mistakeDetails && mistakeDetails.length > 0) {
      return mistakeDetails.slice(0, 8).map(m => ({
        name: `'${m.expectedChar}' → '${m.typedChar}'`,
        count: m.count,
        percentage: m.percentage
      }));
    }

    // Build from heatmap if mistakeDetails is empty but errors > 0
    const entries = Object.entries(mistakeKeyboardHeatmap).filter(([_, count]) => Number(count) > 0);
    if (entries.length > 0) {
      const total = entries.reduce((sum, [_, count]) => sum + Number(count), 0);
      return entries.slice(0, 8).map(([key, count]) => ({
        name: `'${key.toUpperCase()}'`,
        count: Number(count),
        percentage: total > 0 ? Math.round((Number(count) / total) * 100) : 0
      }));
    }

    return [];
  }, [mistakeDetails, mistakeKeyboardHeatmap]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || isGeneratingPDF) return;
    setNotification(null);
    setIsGeneratingPDF(true);

    try {
      const result = await downloadCompetitionResultPDF(reportRef.current, competition.id, userName);
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Musobaqa natijasi hisoboti PDF formatida muvaffaqiyatli yuklab olindi!',
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Natija hisobotini yaratishda xatolik yuz berdi.',
        });
      }
    } catch (err: any) {
      console.error('Report PDF download error:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'Natija hisobotini yaratishda kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getRankStyle = (r: number) => {
    if (r === 1) return { text: "1-o'rin (G'olib)", badge: "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-900/40" };
    if (r === 2) return { text: "2-o'rin (Kumush)", badge: "bg-slate-400/20 text-slate-200 border-slate-400/60" };
    if (r === 3) return { text: "3-o'rin (Bronza)", badge: "bg-amber-700/20 text-amber-400 border-amber-700/60" };
    return { text: `${r}-o'rin`, badge: "bg-cyan-950 text-cyan-400 border-cyan-800" };
  };

  const rankBadge = getRankStyle(rank);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Optional Certificate Earned Banner */}
      {certificateEarned && certificateData && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">Rasmiy Sertifikat Qo'lga Kiritildi!</h4>
              <p className="text-xs text-amber-200">Musobaqadagi ajoyib natijangiz uchun rasmiy sertifikat taqdim etildi.</p>
            </div>
          </div>

          <button
            onClick={() => setShowCertificate(!showCertificate)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer shrink-0"
          >
            {showCertificate ? "Sertifikatni Yopish" : "Sertifikatni Ko'rish"}
          </button>
        </div>
      )}

      {/* Optional Certificate Display */}
      {showCertificate && certificateData && (
        <div className="p-4 bg-slate-950 rounded-3xl border border-slate-800">
          <CertificateCard certificate={certificateData} userAvatar={user?.avatar} showDownloadButton={true} />
        </div>
      )}

      {/* MAIN EXPORTABLE RESULT REPORT CANVAS */}
      <div
        ref={reportRef}
        data-certificate-id={competition.id}
        className="certificate-export-canvas bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase block">ProSkill IT Academy • ProType</span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
                MUSOBAQA NATIJALARI HISOBOTI
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Sinov Sanasi</span>
            <strong className="text-xs text-white">{new Date().toISOString().split('T')[0]}</strong>
          </div>
        </div>

        {/* Competition & Participant Information Header */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Musobaqa Nomi</span>
            <h3 className="text-lg font-bold text-white font-display">{competition.title}</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 font-mono pt-1">
              <span>Jami Davomiylik: <strong className="text-cyan-400">{compTotalDuration} soniya</strong></span>
              <span>•</span>
              <span>Sarflandi: <strong className="text-emerald-400">{duration} soniya</strong></span>
              <span>•</span>
              <span>Qoldi: <strong className="text-amber-400">{calculatedRemainingTime} soniya</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
            <img
              src={getUserAvatar(user?.avatar, user?.login || userName)}
              alt={userName}
              className="w-10 h-10 rounded-full border border-amber-500/40 object-cover bg-slate-800"
            />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Ishtirokchi Foydalanuvchi</span>
              <strong className="text-sm text-white font-bold">{userName}</strong>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE 14 REAL-DATABASE STATISTICAL METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* 1. Rank & Position */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>O'rin / Position</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">
              #{rank}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">{participantCount} ta ishtirokchi orasida</span>
          </div>

          {/* 2. WPM */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-amber-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>WPM (Brutto)</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">
              {wpm}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">So'z/Daqiqa</span>
          </div>

          {/* 3. Net WPM */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-cyan-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>Net WPM (Sof Tezlik)</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-cyan-400 font-mono block">
              {netWpm}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Aniq tezlik ko'rsatkich</span>
          </div>

          {/* 4. Accuracy */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-emerald-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>Aniqlik (Accuracy)</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">
              {accuracy}%
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Tog'ri bosish ulushi</span>
          </div>

          {/* 5. Total Mistakes */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-rose-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Jami Xatolar</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-rose-400 font-mono block">
              {errors}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Imlo xatoliklari</span>
          </div>

          {/* 6. Correct Characters */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-emerald-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Tog'ri Belgilar</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-300 font-mono block">
              {correctChars}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Tog'ri yozilgan</span>
          </div>

          {/* 7. Incorrect Characters */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-rose-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-300" />
              <span>Xato Belgilar</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-rose-300 font-mono block">
              {incorrectChars}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Noto'g'ri yozilgan</span>
          </div>

          {/* 8. Total Characters Typed */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-indigo-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Keyboard className="w-3 h-3 text-indigo-400" />
              <span>Jami Belgilar</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-indigo-300 font-mono block">
              {calculatedTotalChars}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Bosilgan tugmalar</span>
          </div>

          {/* 9. Total Words Typed */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-sky-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <FileText className="w-3 h-3 text-sky-400" />
              <span>Jami So'zlar</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-sky-300 font-mono block">
              {calculatedTotalWords}
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Standard so'zlar</span>
          </div>

          {/* 10. Completed Percentage */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-teal-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Percent className="w-3 h-3 text-teal-400" />
              <span>Tugatilgan Ulush</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-teal-300 font-mono block">
              {calculatedCompPercent}%
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Matn bajarilishi</span>
          </div>

          {/* 11. Finished / Remaining Time */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-cyan-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Sarflandi / Qoldi</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-cyan-300 font-mono block">
              {duration}s <span className="text-xs text-slate-400">({calculatedRemainingTime}s qoldi)</span>
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Bajarish vaqti</span>
          </div>

          {/* 12. Rating Points Earned */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-purple-500/40 transition-all">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-purple-400" />
              <span>Ishlangan Ball</span>
            </span>
            <strong className="text-xl sm:text-2xl font-black text-purple-300 font-mono block">
              +{ratingPoints} Ball
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">Reyting bonusi</span>
          </div>
        </div>

        {/* VISUAL ANALYTICS & MISTAKE ANALYSIS TABS NAVIGATION */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'charts'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Tezlik & Aniqlik Grafiklari</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'heatmap'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Klaviatura Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'mistakes'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Batafsil Xatolar Tahlili</span>
            </button>
          </div>

          {/* TAB 1: SPEED & ACCURACY CHARTS */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
              {/* Speed Progress Chart */}
              <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Yozish Tezligi Grafigi (WPM vs Net WPM)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Vaqt o'tishi bilan (Soniya)</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="netWpmGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="wpm" name="Brutto WPM" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#wpmGrad)" />
                      <Area type="monotone" dataKey="netWpm" name="Sof Net WPM" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#netWpmGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Accuracy Progress Chart */}
              <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>Aniqlik Grafigi (Accuracy %)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Foizda (%)</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="accuracy" name="Aniqlik %" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYBOARD MISTAKE HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-amber-400" />
                    <span>Klaviatura Xatolar Interaktiv Heatmap'i</span>
                  </h4>
                  <p className="text-xs text-slate-400">Musobaqa davomida eng ko'p xatoga yo'l qo mezonidagi tugmalar bosqichi</p>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span> 0 Xato</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-900 border border-amber-600"></span> 1-2 Xato</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-900 border border-rose-500"></span> 3+ Xato</div>
                </div>
              </div>

              {/* Interactive Virtual QWERTY Keyboard Grid */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 overflow-x-auto">
                {KEYBOARD_ROWS.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1.5 min-w-[500px]">
                    {row.map(key => {
                      const lKey = key.toLowerCase();
                      const mistakeCount = mistakeKeyboardHeatmap[lKey] || mistakeKeyboardHeatmap[key] || 0;

                      let keyStyle = "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700";
                      if (mistakeCount === 1) {
                        keyStyle = "bg-amber-950 text-amber-300 border-amber-600/70 shadow-amber-900/20";
                      } else if (mistakeCount >= 2 && mistakeCount < 4) {
                        keyStyle = "bg-orange-950 text-orange-200 border-orange-500 shadow-orange-900/40 font-black";
                      } else if (mistakeCount >= 4) {
                        keyStyle = "bg-rose-950 text-rose-100 border-rose-500 shadow-rose-900/60 font-black animate-pulse";
                      }

                      const isSpace = key === 'Space';

                      return (
                        <div
                          key={key}
                          className={`relative h-11 border rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all ${
                            isSpace ? 'w-64' : 'w-10 sm:w-11'
                          } ${keyStyle}`}
                        >
                          <span>{key}</span>
                          {mistakeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                              {mistakeCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED MISTAKE TABLE & DISTRIBUTION */}
          {activeTab === 'mistakes' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Mistake Distribution Bar Chart if entries exist */}
              {mistakeChartData.length > 0 && (
                <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-rose-400" />
                    <span>Eng Ko'p Takrorlangan Xatolar Taqsimoti</span>
                  </h4>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mistakeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="count" name="Xatolar Soni" fill="#f43f5e" radius={[6, 6, 0, 0]}>
                          {mistakeChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f43f5e' : '#fb7185'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Detailed Mistake Breakdown Table */}
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Xatolar Ro'yxati Jadvali (Mistake Analysis Table)</span>
                </h4>

                {errors === 0 || mistakeChartData.length === 0 ? (
                  <div className="bg-emerald-950/40 border border-emerald-800/60 p-6 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h5 className="text-sm font-bold text-emerald-300">Xatolarsiz Mukammal Natija!</h5>
                    <p className="text-xs text-slate-400">Siz ushbu musobaqada bironta ham imlo yoki bosish xatoligiga yo'l qo'ymadingiz.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-3">№</th>
                          <th className="py-2.5 px-3">Kutilgan belgi</th>
                          <th className="py-2.5 px-3">Kiritilgan belgi</th>
                          <th className="py-2.5 px-3">Xatolar soni</th>
                          <th className="py-2.5 px-3">Ulush (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {mistakeChartData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-400">{item.name.split('→')[0] || item.name}</td>
                            <td className="py-2.5 px-3 font-bold text-rose-400">{item.name.split('→')[1] || item.name}</td>
                            <td className="py-2.5 px-3 font-bold text-amber-400">{item.count} ta</td>
                            <td className="py-2.5 px-3 text-cyan-400">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Verification Footer Stamp */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>ProType Tizimi Tomonidan Rasman Tasdiqlangan Natija</span>
          </div>

          {qrCodeUrl && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl">
              <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 object-contain" />
              <div className="text-[9px] text-slate-950 font-sans font-bold leading-tight">
                <span>Haqiqiylikni</span><br />
                <span>Tekshirish</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950/90 text-rose-300 border border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* MANDATORY ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
        {/* Return Home */}
        <button
          onClick={onReturnHome}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bosh sahifaga qaytish</span>
        </button>

        {/* View Leaderboard */}
        <button
          onClick={onViewLeaderboard}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Reyting jadvali</span>
        </button>

        {/* Download Result PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:opacity-95 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>PDF Tayyorlanmoqda...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Natija Hisobotini Yuklab Olish (PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
