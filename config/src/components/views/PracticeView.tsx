import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';

export const PracticeView: React.FC = () => {
  const { user, refreshUserData } = useAuth();

  const [dbTexts, setDbTexts] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [isLoadingTexts, setIsLoadingTexts] = useState<boolean>(true);

  const [selectedTime, setSelectedTime] = useState<number>(30); // 15, 30, 60, 120
  const [currentText, setCurrentText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');

  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Fetch texts strictly from Database
  useEffect(() => {
    const fetchTexts = async () => {
      setIsLoadingTexts(true);
      try {
        const res = await fetch('/api/texts');
        if (res.ok) {
          const data = await res.json();
          setDbTexts(data || []);
          if (data && data.length > 0) {
            setCurrentText(data[0].content);
          } else {
            setCurrentText('');
          }
        }
      } catch (err) {
        console.error("Failed to load texts from database:", err);
      } finally {
        setIsLoadingTexts(false);
      }
    };
    fetchTexts();
  }, []);

  // Live Metrics
  const [wpm, setWpm] = useState<number>(0);
  const [cpm, setCpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errorCount, setErrorCount] = useState<number>(0);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('Texnologiya va Kelajak');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset Test
  const handleReset = (newText?: string) => {
    const textToSet = newText || currentText;
    setCurrentText(textToSet);
    setUserInput('');
    setIsActive(false);
    setTimeLeft(selectedTime);
    setIsFinished(false);
    setWpm(0);
    setCpm(0);
    setAccuracy(100);
    setErrorCount(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    handleReset();
  }, [selectedTime]);

  // Timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (isFinished) return;

    if (!isActive && val.length > 0) {
      setIsActive(true);
    }

    // Sound effect
    const isSpace = val.endsWith(' ');
    soundManager.playKeyPress(isSpace);

    // Calculate errors
    let errors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== currentText[i]) {
        errors++;
      }
    }

    if (val.length > userInput.length && val[val.length - 1] !== currentText[val.length - 1]) {
      soundManager.playError();
    }

    setUserInput(val);
    setErrorCount(errors);

    // Real-time metrics
    const elapsedSeconds = selectedTime - timeLeft || 1;
    const typedChars = val.length;
    const correctChars = typedChars - errors;

    const calcCpm = Math.round((correctChars / elapsedSeconds) * 60);
    const calcWpm = Math.round(calcCpm / 5);
    const calcAcc = typedChars > 0 ? Math.max(0, Math.round(((typedChars - errors) / typedChars) * 100)) : 100;

    setCpm(calcCpm);
    setWpm(calcWpm);
    setAccuracy(calcAcc);

    // Check if finished text completely
    if (val.length >= currentText.length) {
      handleFinishTest();
    }
  };

  // Finish Test
  const handleFinishTest = async () => {
    setIsActive(false);
    setIsFinished(true);

    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore
    }

    // Submit stats if user logged in
    if (user) {
      try {
        const elapsed = selectedTime - timeLeft || 1;
        const wordsTyped = userInput.trim().split(/\s+/).length;
        await fetch('/api/stats/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            wpm,
            cpm,
            accuracy,
            errors: errorCount,
            testType: 'practice',
            textTitle: 'Oddiy Mashq',
            wordsCount: wordsTyped
          })
        });
        refreshUserData();
      } catch (err) {
        console.error("Stats submission error:", err);
      }
    }
  };

  // Generate AI text
  const handleGenerateAiText = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, difficulty: 'O\'rtacha' })
      });
      const data = await res.json();
      const generated = data.text || data.fallbackText;
      setIsAiModalOpen(false);
      handleReset(generated);
    } catch (err) {
      setIsAiModalOpen(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getRandomSampleText = () => {
    if (dbTexts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dbTexts.length);
    handleReset(dbTexts[randomIndex].content);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Config Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-xl shadow-xl">
        {/* Timer Presets */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <Clock className="w-4 h-4 text-slate-400 ml-2" />
          {[15, 30, 60, 120].map(seconds => (
            <button
              key={seconds}
              onClick={() => setSelectedTime(seconds)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedTime === seconds
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/50 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Matn Yaratish</span>
          </button>

          <button
            onClick={getRandomSampleText}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            Tasodifiy Matn
          </button>
        </div>
      </div>

      {/* Main Interactive Typing Canvas */}
      {isLoadingTexts ? (
        <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Clock className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-semibold">Matnlar ma'lumotlar bazasidan yuklanmoqda...</p>
        </div>
      ) : !currentText || dbTexts.length === 0 ? (
        <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center min-h-[280px]">
          <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-white font-display">
              No texts available. Please add a new text from the Admin Panel.
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              Bazada matnlar mavjud emas. Iltimos, Admin Paneldan yangi matn qo'shing.
            </p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative bg-slate-900/90 border-2 border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl cursor-text transition-all min-h-[280px] flex flex-col justify-between"
        >
        {/* Live Top Stats Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-6 sm:gap-10">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vaqt</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
                {timeLeft}s
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tezlik (WPM)</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                {wpm}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aniqlik</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {accuracy}%
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
            title="Qayta boshlash"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Real Input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className="absolute opacity-0 pointer-events-none"
          autoFocus
        />

        {/* Text Display Canvas */}
        {!isFinished ? (
          <div className="font-mono text-lg sm:text-2xl leading-relaxed tracking-wide select-none min-h-[120px]">
            {currentText.split('').map((char, index) => {
              let charStyle = 'text-slate-500';

              if (index < userInput.length) {
                if (userInput[index] === char) {
                  charStyle = 'text-emerald-400 bg-emerald-950/30 font-bold';
                } else {
                  charStyle = 'text-rose-400 bg-rose-950/80 font-bold underline decoration-rose-500';
                }
              } else if (index === userInput.length) {
                charStyle = 'text-white bg-indigo-600/80 rounded animate-pulse px-0.5 ring-2 ring-indigo-400';
              }

              return (
                <span key={index} className={`transition-colors duration-75 ${charStyle}`}>
                  {char}
                </span>
              );
            })}
          </div>
        ) : (
          /* Post Test Results Screen */
          <div className="py-6 text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Mashq Muvaffaqiyatli Yakunlandi!</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                <span className="block text-xs font-semibold text-slate-400 mb-1">Tezlik (WPM)</span>
                <span className="text-3xl font-black text-indigo-400 font-mono">{wpm}</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                <span className="block text-xs font-semibold text-slate-400 mb-1">Belgilar (CPM)</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">{cpm}</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                <span className="block text-xs font-semibold text-slate-400 mb-1">Aniqlik</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{accuracy}%</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                <span className="block text-xs font-semibold text-slate-400 mb-1">Xatoliklar</span>
                <span className="text-3xl font-black text-rose-400 font-mono">{errorCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleReset()}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Qayta Mashq Qilish</span>
              </button>

              <button
                onClick={getRandomSampleText}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Keyingi Matn
              </button>
            </div>
          </div>
        )}

        {/* Bottom Hint */}
        {!isFinished && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yozishni boshlash uchun klaviaturadan foydalaning...</span>
            <span>Jami belgilar: {currentText.length}</span>
          </div>
        )}
      </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">AI Matn Yaratuvchi</h3>
                <p className="text-xs text-slate-400">Mavzuni tanlang, Gemini AI matn tuzib beradi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mavzu</label>
                <select
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Texnologiya va Kelajak">Texnologiya va Kelajak</option>
                  <option value="O'zbekiston Tarixi va Madaniyati">O'zbekiston Tarixi va Madaniyati</option>
                  <option value="Aql va Muvaffaqiyat Falsafasi">Aql va Muvaffaqiyat Falsafasi</option>
                  <option value="Koinot va Ilm-fan">Koinot va Ilm-fan</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleGenerateAiText}
                  disabled={isAiLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 shadow-md flex items-center gap-2"
                >
                  {isAiLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Matn Yaratish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
