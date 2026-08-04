import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Swords, Check, X, AlertTriangle } from 'lucide-react';

export const BattleNotificationModal: React.FC = () => {
  const {
    incomingChallenge,
    notificationMessage,
    clearNotification,
    respondChallenge
  } = useWebSocket();

  if (!incomingChallenge && !notificationMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp">
      {/* Incoming Battle Challenge Notification */}
      {incomingChallenge && (
        <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 animate-bounce">
              <Swords className="w-6 h-6 text-slate-950" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⚡ JANG CHAQIRIG'I
                </span>
                <span className="text-xs text-slate-400 font-medium">Hozir</span>
              </div>

              <h4 className="text-base font-bold text-white leading-tight font-display truncate">
                {incomingChallenge.inviterName}
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {incomingChallenge.inviterName} has challenged you to a typing battle.
              </p>
              <div className="text-[11px] text-amber-400/90 font-semibold mt-0.5">
                ⭐ Reyting: {incomingChallenge.inviterRating || 1200} • ⏱️ 30 Soniyalik Jang
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => respondChallenge(incomingChallenge.id, false)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4 text-rose-400" />
              Decline (Rad etish)
            </button>
            <button
              onClick={() => respondChallenge(incomingChallenge.id, true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-slate-950" />
              Accept (Qabul qilish)
            </button>
          </div>
        </div>
      )}

      {/* Realtime System Notification */}
      {!incomingChallenge && notificationMessage && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Bildirishnoma</p>
              <p className="text-xs text-slate-400 font-medium">{notificationMessage}</p>
            </div>
          </div>
          <button
            onClick={clearNotification}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
