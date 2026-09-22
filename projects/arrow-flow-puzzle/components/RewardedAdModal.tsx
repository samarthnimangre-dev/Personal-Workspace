'use client';

import React, { useState, useEffect } from 'react';
import { X, Tv, CheckCircle2, Sparkles, Gem, Hammer } from 'lucide-react';
import { sound } from '@/lib/audio';

interface RewardedAdModalProps {
  isOpen: boolean;
  onAdCompleted: () => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onAdCompleted,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setIsFinished(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          sound.playCoin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col items-center relative overflow-hidden">
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Tv className="w-4 h-4 animate-pulse" />
            <span>SPONSORED REWARD AD (CrazyGames / Poki SDK)</span>
          </div>
          {isFinished ? (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-bold">
              Reward in {secondsRemaining}s
            </div>
          )}
        </div>

        {/* Video / Creative Showcase Banner */}
        <div className="w-full my-6 bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mb-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-cyan-300" />
          </div>
          <h4 className="text-lg font-black text-white">SutraDB & AI Micro-SaaS Engine</h4>
          <p className="text-xs text-indigo-200 mt-1 max-w-xs">
            Deploy ultra-fast edge APIs and game servers in under 60 seconds with sub-millisecond vector indexing.
          </p>
          <div className="mt-4 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[11px] font-bold text-cyan-300">
            Ad Impression CPM: $3.80 eCPM
          </div>
        </div>

        {/* Reward Status */}
        {isFinished ? (
          <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>REWARD UNLOCKED!</span>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/70 border border-emerald-500/30 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-1.5 text-fuchsia-300 font-bold text-sm">
                <Gem className="w-4 h-4 text-fuchsia-400" />
                <span>+100 Gems</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-sm">
                <Hammer className="w-4 h-4 text-rose-400" />
                <span>+1 Free Hammer</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playTap();
                onAdCompleted();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              Collect Reward & Return
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Please watch the sponsored demo to receive your boosters ({secondsRemaining}s)...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
