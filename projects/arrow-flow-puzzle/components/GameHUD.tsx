'use client';

import React from 'react';
import { UserEconomy, LevelConfig } from '@/types/game';
import {
  Coins,
  Gem,
  Lightbulb,
  Hammer,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Palette,
  Tv,
  ShoppingBag,
  Code2,
} from 'lucide-react';
import { sound } from '@/lib/audio';

interface GameHUDProps {
  economy: UserEconomy;
  level: LevelConfig;
  movesCount: number;
  combo: number;
  isHammerMode: boolean;
  onToggleHammer: () => void;
  onUseHint: () => void;
  onUseUndo: () => void;
  onUseMagnet: () => void;
  onOpenShop: () => void;
  onOpenThemeSelector: () => void;
  onOpenAdModal: () => void;
  onOpenDevLicenseModal: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  economy,
  level,
  movesCount,
  combo,
  isHammerMode,
  onToggleHammer,
  onUseHint,
  onUseUndo,
  onUseMagnet,
  onOpenShop,
  onOpenThemeSelector,
  onOpenAdModal,
  onOpenDevLicenseModal,
  onToggleSound,
  soundEnabled,
}) => {
  return (
    <div className="w-full max-w-xl flex flex-col gap-3 select-none px-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 px-4 shadow-lg">
        {/* Level & Difficulty info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              {level.difficulty}
            </span>
            {combo > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                🔥 {combo}x COMBO
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{level.title}</h2>
        </div>

        {/* Currency Pill Box */}
        <div className="flex items-center gap-2">
          {/* Coins button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/30 hover:border-amber-400/60 rounded-full px-2.5 py-1 text-xs font-bold text-amber-300 transition-all hover:scale-105 active:scale-95"
            title="Open In-Game Store"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{economy.coins}</span>
            <span className="text-[10px] text-amber-500 bg-amber-400/20 rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
              +
            </span>
          </button>

          {/* Gems button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-fuchsia-950/40 border border-fuchsia-500/30 hover:border-fuchsia-400/60 rounded-full px-2.5 py-1 text-xs font-bold text-fuchsia-300 transition-all hover:scale-105 active:scale-95"
            title="Open In-Game Store"
          >
            <Gem className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>{economy.gems}</span>
            <span className="text-[10px] text-fuchsia-500 bg-fuchsia-400/20 rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
              +
            </span>
          </button>

          {/* Settings / Controls */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => {
                sound.playTap();
                onOpenThemeSelector();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-all"
              title="Themes & Skins"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar: Moves & Quick Action Badges */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>
            Moves: <strong className="text-white">{movesCount}</strong> / {level.parMoves} par
          </span>
        </div>

        {/* Developer Commercial Sale Badge */}
        <button
          onClick={() => {
            sound.playTap();
            onOpenDevLicenseModal();
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full transition-all"
        >
          <Code2 className="w-3 h-3 text-emerald-400" />
          <span>Turnkey Game License ($49)</span>
        </button>
      </div>

      {/* Bottom Booster Dock */}
      <div className="grid grid-cols-5 gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2 shadow-2xl">
        {/* Hint Booster */}
        <button
          onClick={() => {
            sound.playTap();
            onUseHint();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-400/50 transition-all active:scale-95 group relative"
        >
          <Lightbulb className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Hint</span>
          <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.hints}
          </span>
        </button>

        {/* Hammer Booster */}
        <button
          onClick={() => {
            sound.playTap();
            onToggleHammer();
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 group relative ${
            isHammerMode
              ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
              : 'bg-slate-800/60 hover:bg-slate-800 border-rose-500/20 hover:border-rose-400/50'
          }`}
        >
          <Hammer className={`w-5 h-5 ${isHammerMode ? 'text-rose-400 animate-bounce' : 'text-rose-400 group-hover:scale-110 transition-transform'}`} />
          <span className="text-[10px] font-medium text-slate-300 mt-1">
            {isHammerMode ? 'Cancel' : 'Hammer'}
          </span>
          <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.hammers}
          </span>
        </button>

        {/* Undo Move */}
        <button
          onClick={() => {
            sound.playTap();
            onUseUndo();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-blue-500/20 hover:border-blue-400/50 transition-all active:scale-95 group relative"
        >
          <RotateCcw className="w-5 h-5 text-blue-400 group-hover:-rotate-45 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Undo</span>
          <span className="absolute -top-1.5 -right-1 bg-blue-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.undos}
          </span>
        </button>

        {/* Super Magnet */}
        <button
          onClick={() => {
            sound.playTap();
            onUseMagnet();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-fuchsia-500/20 hover:border-fuchsia-400/50 transition-all active:scale-95 group relative"
        >
          <Sparkles className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Magnet</span>
          <span className="absolute -top-1.5 -right-1 bg-fuchsia-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.magnets}
          </span>
        </button>

        {/* Rewarded Ad / Free Booster */}
        <button
          onClick={() => {
            sound.playTap();
            onOpenAdModal();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400/60 transition-all active:scale-95 group relative"
        >
          <Tv className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span className="text-[10px] font-black text-emerald-300 mt-1">Free 🎁</span>
          <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full px-1">
            AD
          </span>
        </button>
      </div>
    </div>
  );
};
