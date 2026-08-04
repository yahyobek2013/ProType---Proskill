import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TestResult } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Activity
} from 'lucide-react';

export const StatsView: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stats/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Fetch user stats error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = results.map((r, idx) => ({
    name: `Test #${idx + 1}`,
    WPM: r.wpm,
    Accuracy: r.accuracy,
    CPM: r.cpm,
    date: new Date(r.date).toLocaleDateString('uz-UZ')
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-7 h-7" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white font-display">Shaxsiy Statistika va Tahlil</h2>
          <p className="text-xs text-slate-400">Yozish tezligingiz, aniqligingiz va rivojlanish grafigingiz</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Maksimal WPM</span>
          </span>
          <span className="text-3xl font-black text-cyan-400 font-mono block">
            {user?.wpm_max || 0}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>O'rtacha Aniqlik</span>
          </span>
          <span className="text-3xl font-black text-emerald-400 font-mono block">
            {user?.accuracy_avg || 100}%
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Tugallangan Testlar</span>
          </span>
          <span className="text-3xl font-black text-indigo-400 font-mono block">
            {user?.tests_completed || 0}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Terilgan So'zlar</span>
          </span>
          <span className="text-3xl font-black text-rose-400 font-mono block">
            {user?.total_words_typed || 0}
          </span>
        </div>
      </div>

      {/* WPM Progress Chart */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white font-display">Tezlik (WPM) Rivojlanish Grafigi</h3>

        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Hali testlar topshirilmadi. Mashq qilishni boshlang!
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Area type="monotone" dataKey="WPM" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#wpmGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
