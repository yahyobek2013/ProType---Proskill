import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Flame, Trophy, Search, Medal, Award, Zap, ShieldCheck } from 'lucide-react';
import { getUserAvatar } from '../../utils/imageUtils';

export const LeaderboardView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.ism} ${u.familiya} ${u.login}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filteredUsers.slice(0, 3);
  const remainingList = filteredUsers.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
              <Flame className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-display">Umumiy Reyting</h2>
            <p className="text-xs text-slate-400">O'zbekistondagi eng tezkor va aniq yozuvchi foydalanuvchilar jamlanmasi</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Foydalanuvchini qidirish..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Reyting yuklanmoqda...</span>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center relative overflow-hidden shadow-xl sm:translate-y-4">
                  <div className="w-8 h-8 bg-slate-700 text-white font-black text-xs rounded-full flex items-center justify-center mx-auto mb-3 shadow">
                    2
                  </div>
                  <img
                    src={getUserAvatar(topThree[1].avatar, topThree[1].login)}
                    alt={topThree[1].ism}
                    className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-slate-400 mb-3 shadow-md"
                  />
                  <h3 className="text-base font-bold text-white font-display">{topThree[1].ism} {topThree[1].familiya}</h3>
                  <span className="text-xs text-slate-400">@{topThree[1].login}</span>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">{topThree[1].wpm_max} WPM</span>
                    <span className="text-emerald-400 font-bold">{topThree[1].accuracy_avg}%</span>
                  </div>
                </div>
              )}

              {/* 1st Place Gold */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl scale-105">
                  <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black text-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    1
                  </div>
                  <img
                    src={getUserAvatar(topThree[0].avatar, topThree[0].login)}
                    alt={topThree[0].ism}
                    className="w-20 h-20 rounded-2xl mx-auto object-cover ring-4 ring-amber-500 mb-3 shadow-xl"
                  />
                  <h3 className="text-lg font-black text-white font-display">{topThree[0].ism} {topThree[0].familiya}</h3>
                  <span className="text-xs text-amber-300">@{topThree[0].login}</span>
                  <div className="mt-4 pt-3 border-t border-amber-900/50 flex items-center justify-center gap-4 text-sm font-mono">
                    <span className="text-amber-400 font-black">{topThree[0].wpm_max} WPM</span>
                    <span className="text-emerald-400 font-bold">{topThree[0].accuracy_avg}%</span>
                  </div>
                </div>
              )}

              {/* 3rd Place Bronze */}
              {topThree[2] && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center relative overflow-hidden shadow-xl sm:translate-y-6">
                  <div className="w-8 h-8 bg-amber-800 text-white font-black text-xs rounded-full flex items-center justify-center mx-auto mb-3 shadow">
                    3
                  </div>
                  <img
                    src={getUserAvatar(topThree[2].avatar, topThree[2].login)}
                    alt={topThree[2].ism}
                    className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-amber-700 mb-3 shadow-md"
                  />
                  <h3 className="text-base font-bold text-white font-display">{topThree[2].ism} {topThree[2].familiya}</h3>
                  <span className="text-xs text-slate-400">@{topThree[2].login}</span>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">{topThree[2].wpm_max} WPM</span>
                    <span className="text-emerald-400 font-bold">{topThree[2].accuracy_avg}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table Leaderboard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider grid grid-cols-12 gap-2">
              <span className="col-span-1 text-center">O'rin</span>
              <span className="col-span-5 sm:col-span-4">Foydalanuvchi</span>
              <span className="col-span-3 sm:col-span-3 text-center">Maksimal WPM</span>
              <span className="col-span-3 sm:col-span-2 text-center">O'rtacha Aniqlik</span>
              <span className="hidden sm:block sm:col-span-2 text-center">Testlar</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className="px-6 py-4 grid grid-cols-12 gap-2 items-center hover:bg-slate-800/40 transition-colors text-xs sm:text-sm"
                >
                  <div className="col-span-1 text-center font-black font-mono text-slate-300">
                    #{idx + 1}
                  </div>

                  <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                    <img
                      src={getUserAvatar(u.avatar, u.login)}
                      alt={u.ism}
                      className="w-9 h-9 rounded-xl object-cover bg-slate-800"
                    />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{u.ism} {u.familiya}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{u.login}</span>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3 text-center font-mono font-black text-cyan-400 text-sm sm:text-base">
                    {u.wpm_max} WPM
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-center font-mono font-bold text-emerald-400">
                    {u.accuracy_avg}%
                  </div>

                  <div className="hidden sm:block sm:col-span-2 text-center font-mono text-slate-400 text-xs">
                    {u.tests_completed} ta
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
