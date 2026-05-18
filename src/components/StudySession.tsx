"use client";

import { Maximize, Activity, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface StudySessionProps {
  isActive: boolean;
  duration: number;
  setDuration: (mins: number) => void;
  timeLeft: number;
  isCompleted: boolean;
  loadingComplete: boolean;
  startSession: () => void;
  endSession: () => void;
  triggerDistractionProtocol: () => void;
  abortSessionSafely: () => void;
}

export default function StudySession({
  isActive,
  duration,
  setDuration,
  timeLeft,
  isCompleted,
  loadingComplete,
  startSession,
  endSession,
  triggerDistractionProtocol,
  abortSessionSafely,
}: StudySessionProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative flex items-center justify-between w-full h-full p-4`}>
      {!isActive ? (
        <div className="flex w-full items-center justify-between gap-8">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-sm text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider">Set Focus Operations</span>
            <div className="flex gap-3 mt-2">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 border-2 ${duration === mins ? 'bg-[var(--color-gold-600)]/20 border-[var(--color-gold-500)] text-white shadow-[0_0_15px_rgba(225,29,72,0.2)] scale-105' : 'bg-[var(--color-obsidian-900)] border-white/5 text-gray-400 hover:border-white/20 hover:text-white'}`}
                >
                  {mins >= 60 ? `${mins / 60} Hr` : `${mins} Min`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="flex items-center gap-3 px-8 py-4 bg-[var(--color-gold-600)] text-white font-bold rounded-2xl hover:bg-[var(--color-gold-400)] transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(225,29,72,0.3)] text-xs uppercase tracking-wider shrink-0"
          >
            <Maximize size={18} />
            ENTER KIOSK ({duration >= 60 ? `${duration / 60} Hr` : `${duration}m`})
          </button>
        </div>
      ) : (
        <div className="flex w-full items-center justify-between">
          {!isCompleted ? (
            <>
              <div className="flex flex-col text-left border-l-2 border-[var(--color-gold-500)] pl-4">
                <div className="text-[var(--color-gold-400)] text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Activity size={14} className="animate-pulse" /> Kiosk Enforcer Engaged
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  Global portal workspace is secure. Timer active in top-right header.
                </div>
              </div>
              <button
                onClick={abortSessionSafely}
                className="px-5 py-2.5 bg-red-900/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-900/20 transition-colors text-xs font-bold tracking-wider uppercase shrink-0"
              >
                Safe Stop
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 w-8 h-8 animate-bounce" />
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Mission Accomplished!</h4>
                  <p className="text-[10px] text-gray-400">
                    {loadingComplete ? "Transmitting credentials..." : "Rewards and syllabus badges successfully claimed."}
                  </p>
                </div>
              </div>
              <button
                onClick={endSession}
                className="bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-500)] text-black text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                De-engage Kiosk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
