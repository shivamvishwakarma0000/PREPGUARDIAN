"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestionStopwatch() {
  const [time, setTime] = useState(0); // centiseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleSaveLap = () => {
    if (time === 0) return;
    setLaps(prev => [time, ...prev].slice(0, 5)); // Keep last 5 question times
    setTime(0);
  };

  const formatTime = (totalCentiseconds: number) => {
    const min = Math.floor(totalCentiseconds / 6000);
    const sec = Math.floor((totalCentiseconds % 6000) / 100);
    const cs = totalCentiseconds % 100;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full justify-between p-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="text-[var(--color-gold-500)] w-4 h-4" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Question Solver Stopwatch</span>
        </div>
        {laps.length > 0 && (
          <span className="text-[10px] text-[var(--color-gold-500)] font-mono flex items-center gap-1">
            <Award size={10} /> Fast: {formatTime(Math.min(...laps))}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center my-auto">
        <span className="text-3xl font-mono font-bold text-white tracking-widest bg-black/40 px-6 py-2 rounded-xl border border-white/5 shadow-inner">
          {formatTime(time)}
        </span>
      </div>

      <div className="flex gap-2 justify-center shrink-0 mt-3">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleStartPause}
          className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${isRunning ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-[var(--color-gold-600)]/10 border-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-600)]/20'}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRunning ? "pause" : "play"}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
        <button 
          onClick={handleSaveLap}
          disabled={time === 0}
          className="bg-[var(--color-gold-600)]/10 border border-[var(--color-gold-500)]/20 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-600)]/20 disabled:opacity-30 disabled:hover:bg-transparent px-3 py-1 text-xs font-bold rounded-lg transition-colors"
        >
          Next Question
        </button>
        <button 
          onClick={handleReset}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 p-2 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {laps.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-2 flex flex-col gap-1 max-h-20 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Previous Solves</p>
          <AnimatePresence>
            {laps.map((lap, idx) => (
              <motion.div 
                key={`${lap}-${idx}`}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-between items-center text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5"
              >
                <span>Q{laps.length - idx} solved in:</span>
                <span className="text-white font-bold">{formatTime(lap)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
