import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { soundManager } from '../../utils/sound';
import { getUserAvatar } from '../../utils/imageUtils';
import confetti from 'canvas-confetti';
import {
  Swords,
  Bot,
  User as UserIcon,
  RotateCcw,
  Trophy,
  Zap,
  XCircle,
  Play,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Timer,
  Send,
  Loader2,
  LogOut,
  Sparkles,
  Shield,
  TrendingUp,
  Award
} from 'lucide-react';

export const BattleView: React.FC = () => {
  const { user } = useAuth();
  const {
    onlineUsers,
    sendChallenge,
    markReady,
    updateProgress,
    leaveBattle,
    activeRoom
  } = useWebSocket();

  // Mode Selection: 'online_players' | 'bot'
  const [battleTab, setBattleTab] = useState<'online_players' | 'bot'>('online_players');

  // Bot Mode State
  const [botDifficulty, setBotDifficulty] = useState<'oson' | 'ortacha' | 'pro'>('ortacha');
  const [botTargetWpm, setBotTargetWpm] = useState<number>(80);

  // Search & Filter Online Users
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'battle'>('all');

  // Database texts
  const [dbTexts, setDbTexts] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [noTextsAvailable, setNoTextsAvailable] = useState<boolean>(false);

  // Battle Engine States
  const [userInput, setUserInput] = useState<string>('');
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(30); // 30s timer requirement

  // Live Stats for Local Player
  const [userProgress, setUserProgress] = useState<number>(0);
  const [userWpm, setUserWpm] = useState<number>(0);
  const [userAcc, setUserAcc] = useState<number>(100);
  const [userErrors, setUserErrors] = useState<number>(0);
  const [userNetWpm, setUserNetWpm] = useState<number>(0);

  // Live Stats for Opponent (Bot or Real Player)
  const [opponentProgress, setOpponentProgress] = useState<number>(0);
  const [opponentWpm, setOpponentWpm] = useState<number>(0);
  const [opponentAcc, setOpponentAcc] = useState<number>(98);
  const [opponentErrors, setOpponentErrors] = useState<number>(0);
  const [opponentNetWpm, setOpponentNetWpm] = useState<number>(0);

  // Battle Text string
  const [battleText, setBattleText] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sync Bot Difficulty
  useEffect(() => {
    if (botDifficulty === 'oson') setBotTargetWpm(55);
    if (botDifficulty === 'ortacha') setBotTargetWpm(80);
    if (botDifficulty === 'pro') setBotTargetWpm(110);
  }, [botDifficulty]);

  // Load texts from Admin DB
  useEffect(() => {
    fetch('/api/texts')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setDbTexts(data);
          setBattleText(data[0].content);
          setNoTextsAvailable(false);
        } else {
          setNoTextsAvailable(true);
        }
      })
      .catch(() => setNoTextsAvailable(true));
  }, []);

  // Sync active Room state from WebSocketContext
  useEffect(() => {
    if (!activeRoom) {
      if (battleTab === 'online_players' && gameState !== 'idle' && gameState !== 'finished') {
        setGameState('idle');
      }
      return;
    }

    setBattleText(activeRoom.text || "Klaviaturada tezlik va aniqlik bellashuvining 30 soniyalik qizg'in bosqichi!");

    if (activeRoom.status === 'pending' || activeRoom.status === 'waiting') {
      setGameState('waiting');
    } else if (activeRoom.status === 'racing') {
      if (gameState !== 'racing' && gameState !== 'countdown' && gameState !== 'finished') {
        setGameState('countdown');
        setCountdown(3);
        setTimeLeftSec(30);
      }

      // Sync opponent live progress
      const isInviter = activeRoom.inviterId === user?.id;
      const oppState = isInviter ? activeRoom.inviteeState : activeRoom.inviterState;
      setOpponentProgress(oppState.progress || 0);
      setOpponentWpm(oppState.wpm || 0);
      setOpponentAcc(oppState.accuracy || 100);
      setOpponentErrors(oppState.errors || 0);
      setOpponentNetWpm(oppState.netWpm || 0);
    } else if (activeRoom.status === 'finished') {
      if (gameState !== 'finished') {
        setGameState('finished');
        if (activeRoom.winnerId === user?.id) {
          soundManager.playSuccess();
          try { confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } }); } catch (e) {}
        }
      }
    }
  }, [activeRoom, user?.id]);

  // Countdown controller
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'countdown') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      } else {
        setGameState('racing');
        setTimeLeftSec(30);
        startTimeRef.current = Date.now();
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  // 30-Second Fixed Battle Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'racing') {
      timer = setInterval(() => {
        setTimeLeftSec(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Finish battle when 30 seconds elapse
            if (battleTab === 'bot') {
              finishBotMatch();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, battleTab]);

  // Bot simulation during race
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'racing' && battleTab === 'bot') {
      const charsPerSecond = (botTargetWpm * 5) / 60;
      const totalChars = battleText.length || 150;

      interval = setInterval(() => {
        setOpponentProgress(prev => Math.min(100, prev + (charsPerSecond / totalChars) * 100));
        setOpponentWpm(botTargetWpm);
        setOpponentAcc(botDifficulty === 'pro' ? 99 : 96);
        setOpponentNetWpm(botTargetWpm);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [gameState, battleTab, botTargetWpm, botDifficulty, battleText]);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'racing') return;

    const val = e.target.value;
    soundManager.playKeyPress(val.endsWith(' '));
    setUserInput(val);

    let errCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== battleText[i]) errCount++;
    }

    const correctChars = val.length - errCount;
    const progress = Math.min(100, (correctChars / battleText.length) * 100);
    setUserProgress(progress);

    if (startTimeRef.current) {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000 || 0.1;
      const grossWpm = Math.round((correctChars / 5) / (elapsedSec / 60));
      const acc = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;
      const netWpm = Math.max(0, Math.round(grossWpm - (errCount / (elapsedSec / 60))));

      setUserWpm(grossWpm);
      setUserAcc(acc);
      setUserErrors(errCount);
      setUserNetWpm(netWpm);

      if (battleTab === 'online_players' && activeRoom) {
        updateProgress(activeRoom.id, {
          wpm: grossWpm,
          accuracy: acc,
          progress,
          errors: errCount,
          timeSec: Math.round(elapsedSec),
          netWpm,
          finished: progress >= 100
        });
      }
    }
  };

  // Bot Match Finish logic
  const finishBotMatch = () => {
    setGameState('finished');
    if (userNetWpm >= opponentNetWpm) {
      soundManager.playSuccess();
      try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch (e) {}
    }
  };

  // Start Bot Match
  const handleStartBotBattle = () => {
    setUserInput('');
    setUserProgress(0);
    setOpponentProgress(0);
    setUserWpm(0);
    setUserAcc(100);
    setUserErrors(0);
    setUserNetWpm(0);

    if (dbTexts.length > 0) {
      const txt = dbTexts[Math.floor(Math.random() * dbTexts.length)].content;
      setBattleText(txt);
    }

    setGameState('countdown');
    setCountdown(3);
    setTimeLeftSec(30);
  };

  // Filtered Online Users List
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];
  const filteredUsers = safeOnlineUsers.filter(u => {
    if (u.id === user?.id) return false;
    const matchesQuery = `${u.ism} ${u.familiya} ${u.login}`.toLowerCase().includes(userSearch.toLowerCase());
    if (statusFilter === 'online') return matchesQuery && u.status === 'Online';
    if (statusFilter === 'battle') return matchesQuery && u.status === 'In Battle';
    return matchesQuery;
  });

  const isInviter = activeRoom?.inviterId === user?.id;
  const myReadyState = isInviter ? activeRoom?.inviterReady : activeRoom?.inviteeReady;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 p-0.5 shadow-xl shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Swords className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white font-display">Onlayn Klaviaturiy Janglar</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  REAL-TIME WEBSOCKET
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real o'yinchilar bilan 30 soniyalik tezlik janglarida qatnashing. G'olib: +20 Reyting, Mag'lub: -10 Reyting!
              </p>
            </div>
          </div>

          {/* Tab Switcher: Online Players vs AI Bot */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => { setBattleTab('online_players'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                battleTab === 'online_players'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Onlayn O'yinchilar</span>
              {safeOnlineUsers.filter(u => u.status === 'Online').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => { setBattleTab('bot'); setGameState('idle'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                battleTab === 'bot'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>2. AI Bot Bilan Mashq</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Online Players View */}
        {battleTab === 'online_players' && !activeRoom && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Statussiz saralash:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Barchasi ({safeOnlineUsers.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('online')}
                    className={`px-3 py-1 rounded-lg ${statusFilter === 'online' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                  >
                    Onlayn ({safeOnlineUsers.filter(u => u.status === 'Online').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('battle')}
                    className={`px-3 py-1 rounded-lg ${statusFilter === 'battle' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'text-slate-400 hover:text-white'}`}
                  >
                    Jangda ({safeOnlineUsers.filter(u => u.status === 'In Battle').length})
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ism yoki taxallus bo'yicha qidiruv..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Online Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[440px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  Hozircha mos foydalanuvchilar topilmadi. Boshqa o'yinchilar tizimga kirishini kuting!
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/50 transition-all flex items-center justify-between gap-3 shadow-lg group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={getUserAvatar(u.avatar, u.login)}
                          alt={u.ism}
                          className="w-12 h-12 rounded-2xl object-cover bg-slate-900 border border-slate-800"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            u.status === 'Online'
                              ? 'bg-emerald-400'
                              : u.status === 'In Battle'
                              ? 'bg-amber-400'
                              : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate font-display">
                            {u.ism} {u.familiya}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">@{u.login}</p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            ⭐ {u.rating || 1200}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === 'Online'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.status === 'In Battle'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => sendChallenge(u.id)}
                      disabled={u.status === 'In Battle'}
                      className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                        u.status === 'In Battle'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                      }`}
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Challenge</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Real-time Battle Room (Waiting state for accepted match) */}
        {activeRoom && gameState === 'waiting' && (
          <div className="p-6 bg-slate-950 border-2 border-amber-500/60 rounded-3xl space-y-6 text-center animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>JANG XONASI • REAL-TIME ROOM</span>
            </div>

            <h3 className="text-xl font-bold text-white font-display">
              Ikkala o'yinchi ham "Boshlash" tugmasini bosishi kerak!
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto py-2">
              {/* Player 1 Card */}
              <div className={`p-5 rounded-2xl border space-y-3 transition-all ${
                activeRoom.inviterReady
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <img
                  src={activeRoom.inviterAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeRoom.inviterId}`}
                  alt={activeRoom.inviterName}
                  className="w-16 h-16 rounded-2xl mx-auto object-cover bg-slate-800 border-2 border-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{activeRoom.inviterName}</h4>
                  <span className="text-xs text-amber-400 font-bold">⭐ {activeRoom.inviterRating || 1200} Reyting</span>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                    activeRoom.inviterReady
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeRoom.inviterReady ? 'Tayyor ✓' : 'Kutilmoqda...'}
                  </span>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className={`p-5 rounded-2xl border space-y-3 transition-all ${
                activeRoom.inviteeReady
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <img
                  src={activeRoom.inviteeAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeRoom.inviteeId}`}
                  alt={activeRoom.inviteeName}
                  className="w-16 h-16 rounded-2xl mx-auto object-cover bg-slate-800 border-2 border-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{activeRoom.inviteeName}</h4>
                  <span className="text-xs text-amber-400 font-bold">⭐ {activeRoom.inviteeRating || 1200} Reyting</span>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                    activeRoom.inviteeReady
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeRoom.inviteeReady ? 'Tayyor ✓' : 'Kutilmoqda...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => markReady(activeRoom.id)}
                disabled={myReadyState}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm text-slate-950 shadow-xl transition-all ${
                  myReadyState
                    ? 'bg-emerald-500 opacity-80 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 cursor-pointer'
                }`}
              >
                {myReadyState ? 'Siz Tayyorsiz ✓' : 'Start Battle (Boshlash)'}
              </button>

              <button
                onClick={() => leaveBattle(activeRoom.id)}
                className="px-6 py-3.5 rounded-2xl font-bold text-xs text-rose-400 bg-rose-950/40 border border-rose-900 hover:bg-rose-900/60 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Bot Configuration */}
        {battleTab === 'bot' && gameState === 'idle' && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-300">
                AI Bot qiyinchilik darajasini tanlang:
              </span>
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setBotDifficulty('oson')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    botDifficulty === 'oson' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Oson (55 WPM)
                </button>
                <button
                  onClick={() => setBotDifficulty('ortacha')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    botDifficulty === 'ortacha' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  O'rtacha (80 WPM)
                </button>
                <button
                  onClick={() => setBotDifficulty('pro')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    botDifficulty === 'pro' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pro AI (110 WPM)
                </button>
              </div>
            </div>

            <div className="py-6 text-center">
              <button
                onClick={handleStartBotBattle}
                className="px-10 py-4.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 shadow-xl transition-all cursor-pointer inline-flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>BOT BILAN MASHQNI BOSHLASH (30 SONIYA)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Race Canvas */}
      {noTextsAvailable ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-amber-500 animate-pulse" />
          <h3 className="text-lg font-bold text-white font-display">
            No texts available. Please add a new text from the Admin Panel.
          </h3>
          <p className="text-xs text-slate-400">
            Bazada jang uchun matnlar topilmadi. Admin paneldan yangi matn kiriting.
          </p>
        </div>
      ) : (
        (gameState === 'countdown' || gameState === 'racing' || gameState === 'finished') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-fadeIn">
            {/* Countdown Screen */}
            {gameState === 'countdown' && (
              <div className="py-12 text-center space-y-3">
                <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 animate-bounce font-mono block">
                  {countdown > 0 ? countdown : "G'ALABA UCHUN BOSHLANG!"}
                </span>
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                  30 Soniyalik Jang Boshlanmoqda!
                </span>
              </div>
            )}

            {/* Race Arena */}
            {(gameState === 'racing' || gameState === 'finished') && (
              <div className="space-y-6">
                {/* Timer Header */}
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Timer className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qolgan Vaqt</span>
                      <span className="text-xl font-black text-amber-400 font-mono">{timeLeftSec}s</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format</span>
                    <span className="text-xs font-bold text-slate-200">30 Soniya Poshsho Jang</span>
                  </div>
                </div>

                {/* Player 1 Progress Bar (You) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-indigo-400 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Siz ({user ? `${user.ism} ${user.familiya}` : "O'yinchi"})</span>
                    </span>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-cyan-400">{userWpm} WPM</span>
                      <span className="text-emerald-400">{userAcc}% Aniqlik</span>
                      <span className="text-rose-400">{userErrors} Xato</span>
                    </div>
                  </div>
                  <div className="relative h-12 bg-slate-950 rounded-2xl p-1.5 border border-slate-800 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-400 rounded-xl transition-all duration-200 flex items-center justify-end pr-3 text-white text-sm font-black shadow-lg"
                      style={{ width: `${Math.max(6, userProgress)}%` }}
                    >
                      🏎️
                    </div>
                  </div>
                </div>

                {/* Player 2 Progress Bar (Opponent) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-rose-400 flex items-center gap-2">
                      {battleTab === 'bot' ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      <span>
                        {battleTab === 'bot'
                          ? `AI Bot (${botDifficulty.toUpperCase()})`
                          : activeRoom
                          ? (isInviter ? activeRoom.inviteeName : activeRoom.inviterName)
                          : "Raqib"}
                      </span>
                    </span>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-rose-300">{opponentWpm} WPM</span>
                      <span className="text-emerald-300">{opponentAcc}% Aniqlik</span>
                      <span className="text-amber-300">{opponentErrors} Xato</span>
                    </div>
                  </div>
                  <div className="relative h-12 bg-slate-950 rounded-2xl p-1.5 border border-slate-800 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 rounded-xl transition-all duration-200 flex items-center justify-end pr-3 text-white text-sm font-black shadow-lg"
                      style={{ width: `${Math.max(6, opponentProgress)}%` }}
                    >
                      {battleTab === 'bot' ? '🤖' : '🏎️'}
                    </div>
                  </div>
                </div>

                {/* Typing Box */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="pt-4 border-t border-slate-800 space-y-4 cursor-text"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInputChange}
                    disabled={gameState === 'finished'}
                    className="absolute opacity-0 pointer-events-none"
                  />

                  <div className="font-mono text-base sm:text-xl leading-relaxed p-6 bg-slate-950/90 rounded-2xl border border-slate-800 select-none shadow-inner min-h-[140px]">
                    {battleText.split('').map((char, idx) => {
                      let cls = 'text-slate-500';
                      if (idx < userInput.length) {
                        cls = userInput[idx] === char ? 'text-emerald-400 font-bold' : 'text-rose-400 bg-rose-950/80 font-bold px-0.5 rounded';
                      } else if (idx === userInput.length) {
                        cls = 'text-white bg-indigo-600 rounded px-0.5 animate-pulse font-bold';
                      }
                      return <span key={idx} className={cls}>{char}</span>;
                    })}
                  </div>
                </div>

                {/* Victory Modal */}
                {gameState === 'finished' && (
                  <div className="p-8 bg-slate-950/95 border border-slate-800 rounded-3xl text-center space-y-6 animate-fadeIn shadow-2xl">
                    {userNetWpm >= opponentNetWpm ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 shadow-xl shadow-emerald-500/20">
                          <Trophy className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-emerald-400 font-display">SIZ G'ALABA QOZONDINGIZ!</h3>
                        <p className="text-sm text-slate-300 font-medium max-w-md mx-auto">
                          Yuqori unumdorlik va tezlik tufayli g'alaba qozondingiz! <span className="text-emerald-400 font-bold">+20 Reyting</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-950/80 border-2 border-rose-500 text-rose-400 shadow-xl shadow-rose-500/20">
                          <XCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-rose-400 font-display">MAG'LUBIYAT</h3>
                        <p className="text-sm text-slate-300 font-medium max-w-md mx-auto">
                          Raqib bu safar ustun keldi! <span className="text-rose-400 font-bold">-10 Reyting</span>
                        </p>
                      </div>
                    )}

                    {/* Comparison Table */}
                    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="text-left font-sans text-slate-400 space-y-2 pt-6">
                        <div>Net WPM</div>
                        <div>Aniqlik</div>
                        <div>Xatolar</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl space-y-2 text-center border border-indigo-900/50">
                        <div className="font-bold text-indigo-400 border-b border-slate-800 pb-1 font-sans">Siz</div>
                        <div className="font-bold text-cyan-400">{userNetWpm} WPM</div>
                        <div className="font-bold text-emerald-400">{userAcc}%</div>
                        <div className="font-bold text-rose-400">{userErrors} ta</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl space-y-2 text-center border border-rose-900/50">
                        <div className="font-bold text-rose-400 border-b border-slate-800 pb-1 font-sans">Raqib</div>
                        <div className="font-bold text-rose-300">{opponentNetWpm} WPM</div>
                        <div className="font-bold text-emerald-300">{opponentAcc}%</div>
                        <div className="font-bold text-amber-300">{opponentErrors} ta</div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setGameState('idle'); leaveBattle(activeRoom?.id || ''); }}
                      className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-90 shadow-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Yangi Jang Boshlash</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
