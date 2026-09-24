// Responsive mobile-first GameView container with top HUD, lives system, sound/haptic controls, booster toolbar, and modals
import React from 'react';
import type { GameEngineState } from '../engine/GameEngine';
import type { BoosterType, UserProgress } from '../engine/types';
import type { GameSettings } from '../persistence/storage';
import { SvgBoard } from './SvgBoard';
import { SettingsModal } from './SettingsModal';
import { ShopModal } from './ShopModal';

interface GameViewProps {
  state: GameEngineState;
  progress: UserProgress;
  settings: GameSettings;
  lives: number;
  maxLives: number;
  isGameOver: boolean;
  isSettingsOpen: boolean;
  isHammerActive: boolean;
  isBombActive: boolean;
  isShopOpen: boolean;
  canClaimDailyReward: boolean;
  allLevels: readonly { id: number; name: string; difficulty: string }[];
  onArrowTap: (arrowId: string) => void;
  onTriggerHint: () => void;
  onTriggerHammer: () => void;
  onTriggerBomb: () => void;
  onTriggerUndo: () => void;
  onCancelBooster: () => void;
  onOpenShop: () => void;
  onCloseShop: () => void;
  onBuyBooster: (type: BoosterType) => boolean;
  onClaimDailyReward: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onSelectLevel: (levelId: number) => void;
  onContinueZen: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleTheme: () => void;
  onToggleGridDots?: () => void;
  onToggleZenMode: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  state,
  progress,
  settings,
  lives,
  maxLives,
  isGameOver,
  isSettingsOpen,
  isHammerActive,
  isBombActive,
  isShopOpen,
  canClaimDailyReward,
  allLevels,
  onArrowTap,
  onTriggerHint,
  onTriggerHammer,
  onTriggerBomb,
  onTriggerUndo,
  onCancelBooster,
  onOpenShop,
  onCloseShop,
  onBuyBooster,
  onClaimDailyReward,
  onRestart,
  onNextLevel,
  onSelectLevel,
  onContinueZen,
  onToggleSound,
  onToggleHaptics,
  onToggleTheme,
  onToggleGridDots,
  onToggleZenMode,
  onOpenSettings,
  onCloseSettings,
}) => {
  const { level, board, arrows, movesCount, status } = state;
  const arrowsList = Array.from(arrows.values());
  const activeCount = arrowsList.filter((a) => !a.isEscaped).length;
  const totalCount = level.arrows.length;

  const isDark = settings.theme === 'dark';
  const isEyeComfort = settings.theme === 'eye-comfort';
  const isMinimalWhite = settings.theme === 'minimal-white' || settings.theme === 'light';

  // Star rating calculation based on moves vs par
  const starsEarned =
    movesCount <= level.parMoves
      ? 3
      : movesCount <= level.parMoves + 2
      ? 2
      : movesCount <= level.parMoves + 4
      ? 1
      : 0;

  const rewardCoins = level.rewardCoins ?? 50 + starsEarned * 25;

  return (
    <div
      className={`game-bg-container flex flex-col justify-between items-center w-full max-w-md mx-auto min-h-[100dvh] h-[100dvh] px-3 sm:px-4 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] select-none relative overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'text-slate-100 bg-[#090d16]'
          : isEyeComfort
          ? 'text-[#4a3525] bg-[#faf5ed]'
          : 'text-slate-900 bg-white'
      }`}
    >
      {/* =====================================================================
          Top Header Bar & HUD
          ===================================================================== */}
      <header
        className={`w-full flex items-center justify-between rounded-2xl p-2.5 px-3.5 border shadow-sm backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-slate-950/50'
            : isEyeComfort
            ? 'bg-[#f5ebd7]/90 border-[#d6ccbe]/80 shadow-[#e0d3c1]/40'
            : 'bg-white/95 border-slate-200/90 shadow-slate-200/50'
        }`}
      >
        {/* Left: Level info & Remaining count */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                isDark
                  ? 'text-cyan-400'
                  : isEyeComfort
                  ? 'text-[#8c6b4e]'
                  : 'text-slate-900 font-extrabold'
              }`}
            >
              Level {level.id}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                isDark
                  ? 'bg-slate-800 text-slate-400'
                  : isEyeComfort
                  ? 'bg-[#e8decb] text-[#5c4033]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {activeCount} / {totalCount} left
            </span>
          </div>
          <span
            className={`text-[11px] font-semibold truncate max-w-[110px] ${
              isDark
                ? 'text-slate-300'
                : isEyeComfort
                ? 'text-[#5c4033]'
                : 'text-slate-700'
            }`}
          >
            {level.name}
          </span>
        </div>

        {/* Center: Lives or Zen indicator + Coins */}
        <div className="flex flex-col items-center gap-1">
          {settings.zenMode ? (
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-black border ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : isEyeComfort
                  ? 'bg-emerald-100/60 border-emerald-400/40 text-emerald-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              }`}
              title="Zen Mode: Unlimited Lives"
            >
              <span className="text-xs">♾️</span>
              <span className="text-[9px] uppercase tracking-wider">ZEN</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1"
              title={`${lives} / ${maxLives} Lives Remaining`}
            >
              {Array.from({ length: maxLives }).map((_, idx) => {
                const isAlive = idx < lives;
                if (isEyeComfort) {
                  // Eye Comfort: Sky-Blue Water Droplets (#38bdf8)
                  return (
                    <span
                      key={idx}
                      className={`text-base transition-all duration-300 select-none ${
                        isAlive
                          ? 'drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] scale-100 opacity-100'
                          : 'scale-85 opacity-25 grayscale'
                      }`}
                    >
                      💧
                    </span>
                  );
                } else {
                  // Minimal White & Dark: 3 Red Hearts (#ef4444)
                  return (
                    <span
                      key={idx}
                      className={`text-base transition-all duration-300 select-none ${
                        isAlive
                          ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.65)] scale-100 text-rose-500'
                          : 'scale-90 opacity-25 text-slate-500/40 heart-lost-anim'
                      }`}
                    >
                      {isAlive ? '❤️' : '🤍'}
                    </span>
                  );
                }
              })}
            </div>
          )}

          {/* Coins badge: Click to open Booster Vault */}
          <button
            onClick={onOpenShop}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black transition-transform active:scale-95 cursor-pointer shadow-sm ${
              isDark
                ? 'bg-slate-800/90 border-amber-500/40 text-amber-400 hover:bg-slate-700'
                : isEyeComfort
                ? 'bg-[#f0e7db] border-[#cbbca7] text-[#634832] hover:bg-[#e8decb]'
                : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
            title="Open Booster Vault"
            aria-label="Open Booster Store"
          >
            <span>🪙</span>
            <span>{progress.coins ?? 100}</span>
            <span className="text-[8px] opacity-75 font-bold">+</span>
          </button>
        </div>

        {/* Right: Moves & Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Moves HUD */}
          <div className="flex flex-col items-end mr-0.5">
            <span
              className={`text-[9px] uppercase font-bold ${
                isDark
                  ? 'text-slate-400'
                  : isEyeComfort
                  ? 'text-[#8c6b4e]'
                  : 'text-slate-500'
              }`}
            >
              Moves
            </span>
            <span className="text-xs font-black leading-none">
              {movesCount}
              <span
                className={`text-[10px] font-normal ${
                  isDark
                    ? 'text-slate-500'
                    : isEyeComfort
                    ? 'text-[#a6907c]'
                    : 'text-slate-400'
                }`}
              >
                /{level.parMoves}
              </span>
            </span>
          </div>

          {/* Theme Palette Switcher Button */}
          <button
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-transform active:scale-95 border cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-amber-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={`Switch Theme (Current: ${
              isDark ? 'Cyber Dark' : isEyeComfort ? 'Eye Comfort' : 'Minimal White'
            })`}
            aria-label="Switch Display Theme"
          >
            {isEyeComfort ? '🍵' : isMinimalWhite ? '☀️' : '🌙'}
          </button>

          {/* Quick Sound Mute Button */}
          <button
            onClick={onToggleSound}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-transform active:scale-95 border cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={settings.soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {settings.soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Quick Restart Button */}
          <button
            onClick={onRestart}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform active:scale-95 border cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Restart Level"
            aria-label="Restart current level"
          >
            ↻
          </button>

          {/* Settings / Pause Button */}
          <button
            onClick={onOpenSettings}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-transform active:scale-95 border cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Pause & Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Subtitle / Mechanic info banner */}
      {level.subtitle && (
        <div
          className={`w-full text-center text-[11px] font-semibold tracking-tight py-1 px-3 truncate ${
            isDark
              ? 'text-cyan-400'
              : isEyeComfort
              ? 'text-[#785e49]'
              : 'text-slate-600'
          }`}
        >
          {level.subtitle}
        </div>
      )}

      {/* Hammer Mode Active Banner */}
      {isHammerActive && (
        <div
          onClick={onCancelBooster}
          className="w-full bg-rose-600/95 hover:bg-rose-500 text-white text-[11px] font-black py-1.5 px-3 rounded-xl mb-1 text-center animate-pulse flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer transition-colors"
          title="Click to cancel"
        >
          <span>🔨</span>
          <span>HAMMER ACTIVE: Tap any arrow to shatter it! (Tap to Cancel)</span>
        </div>
      )}

      {/* Bomb Mode Active Banner */}
      {isBombActive && (
        <div
          onClick={onCancelBooster}
          className="w-full bg-orange-600/95 hover:bg-orange-500 text-white text-[11px] font-black py-1.5 px-3 rounded-xl mb-1 text-center animate-pulse flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/40 cursor-pointer transition-colors"
          title="Click to cancel"
        >
          <span>💣</span>
          <span>BOMB ACTIVE: Tap any arrow to trigger 3x3 blast! (Tap to Cancel)</span>
        </div>
      )}

      {/* =====================================================================
          Main Stage: Borderless Free-Floating SVG Canvas (Zero Blocks / Zero Boxes)
          ===================================================================== */}
      <main className="flex-1 w-full flex items-center justify-center my-auto py-2">
        <SvgBoard
          board={board}
          arrows={arrowsList}
          theme={settings.theme}
          showGridDots={settings.showGridDots}
          onArrowTap={onArrowTap}
          onCancelBooster={onCancelBooster}
        />
      </main>

      {/* =====================================================================
          Clean Floating Circular Action Buttons (Hint, Grid Alignment, Boosters)
          ===================================================================== */}
      <section className="w-full flex items-center justify-center gap-3 sm:gap-4 my-2 px-2">
        {/* Grid Alignment Toggle Button */}
        <button
          onClick={onToggleGridDots}
          className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border font-bold text-sm transition-all active:scale-95 shadow-md cursor-pointer ${
            settings.showGridDots
              ? isDark
                ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-400 shadow-cyan-950/40'
                : isEyeComfort
                ? 'bg-[#f0e7db] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 border-slate-300 text-slate-800'
              : isDark
              ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              : 'bg-slate-100/50 border-slate-200 text-slate-400 opacity-60'
          }`}
          title={settings.showGridDots ? 'Hide Grid Guide Dots' : 'Show Grid Guide Dots'}
          aria-label="Toggle Grid Guide Dots"
        >
          <span className="text-base leading-none">▦</span>
          <span className="text-[7px] uppercase font-black tracking-wider leading-none mt-0.5">
            Grid
          </span>
        </button>

        {/* Hint Booster - Prominent Floating Circular Button */}
        <button
          onClick={(progress.inventory?.hint ?? 0) > 0 ? onTriggerHint : onOpenShop}
          disabled={status === 'won' || isGameOver}
          className={`w-14 h-14 rounded-full relative flex flex-col items-center justify-center border font-bold transition-all active:scale-95 shadow-lg cursor-pointer ${
            (progress.inventory?.hint ?? 0) > 0
              ? isDark
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/50 text-amber-300 shadow-amber-950/40'
                : isEyeComfort
                ? 'bg-gradient-to-b from-[#fde68a]/30 to-[#f0e7db] border-[#d4b483] text-[#785e49]'
                : 'bg-gradient-to-b from-amber-50 to-white border-amber-300 text-amber-800 shadow-amber-100'
              : isDark
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
              : isEyeComfort
              ? 'bg-[#ede3d4]/50 border-[#d6ccbe]/60 text-[#a6907c] opacity-60'
              : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
          }`}
          title="Get a hint for the next unblocked arrow"
          aria-label="Hint Booster"
        >
          <span className="text-lg select-none leading-none">💡</span>
          <span className="text-[8px] uppercase font-black tracking-wider leading-none mt-0.5">
            Hint
          </span>
          {/* Badge */}
          <span
            className={`absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-md ${
              (progress.inventory?.hint ?? 0) > 0
                ? isDark
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-600 text-white'
                : isDark
                ? 'bg-slate-600 text-white'
                : isEyeComfort
                ? 'bg-[#8c6b4e] text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {(progress.inventory?.hint ?? 0) > 0 ? progress.inventory?.hint : '+'}
          </span>
        </button>

        {/* Undo Booster */}
        <button
          onClick={(progress.inventory?.undo ?? 0) > 0 ? onTriggerUndo : onOpenShop}
          disabled={status === 'won' || isGameOver}
          className={`w-12 h-12 rounded-full relative flex flex-col items-center justify-center border font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
            (progress.inventory?.undo ?? 0) > 0
              ? isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-cyan-500/30 text-cyan-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 border-slate-200 text-slate-800'
              : isDark
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
              : isEyeComfort
              ? 'bg-[#ede3d4]/50 border-[#d6ccbe]/60 text-[#a6907c] opacity-60'
              : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
          }`}
          title="Undo previous move"
          aria-label="Undo Booster"
        >
          <span className="text-base select-none leading-none">↩️</span>
          <span className="text-[7px] uppercase font-black tracking-wider leading-none mt-0.5">
            Undo
          </span>
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm ${
              (progress.inventory?.undo ?? 0) > 0
                ? isDark
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-cyan-600 text-white'
                : isDark
                ? 'bg-slate-600 text-white'
                : isEyeComfort
                ? 'bg-[#8c6b4e] text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {(progress.inventory?.undo ?? 0) > 0 ? progress.inventory?.undo : '+'}
          </span>
        </button>

        {/* Hammer Booster */}
        <button
          onClick={(progress.inventory?.hammer ?? 0) > 0 ? onTriggerHammer : onOpenShop}
          disabled={status === 'won' || isGameOver}
          className={`w-12 h-12 rounded-full relative flex flex-col items-center justify-center border font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
            isHammerActive
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-900/50'
              : (progress.inventory?.hammer ?? 0) > 0
              ? isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-rose-500/30 text-rose-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 border-slate-200 text-slate-800'
              : isDark
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
              : isEyeComfort
              ? 'bg-[#ede3d4]/50 border-[#d6ccbe]/60 text-[#a6907c] opacity-60'
              : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
          }`}
          title="Smash any arrow blocking your path"
          aria-label="Hammer Booster"
        >
          <span className="text-base select-none leading-none">🔨</span>
          <span className="text-[7px] uppercase font-black tracking-wider leading-none mt-0.5">
            {isHammerActive ? 'Active' : 'Hammer'}
          </span>
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm ${
              (progress.inventory?.hammer ?? 0) > 0
                ? 'bg-rose-500 text-white'
                : isDark
                ? 'bg-slate-600 text-white'
                : isEyeComfort
                ? 'bg-[#8c6b4e] text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {(progress.inventory?.hammer ?? 0) > 0 ? progress.inventory?.hammer : '+'}
          </span>
        </button>

        {/* Bomb Booster */}
        <button
          onClick={(progress.inventory?.bomb ?? 0) > 0 ? onTriggerBomb : onOpenShop}
          disabled={status === 'won' || isGameOver}
          className={`w-12 h-12 rounded-full relative flex flex-col items-center justify-center border font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
            isBombActive
              ? 'bg-orange-600 border-orange-400 text-white animate-pulse shadow-orange-900/50'
              : (progress.inventory?.bomb ?? 0) > 0
              ? isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-orange-500/30 text-orange-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] border-[#cbbca7] text-[#4a3525]'
                : 'bg-slate-100 border-slate-200 text-slate-800'
              : isDark
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
              : isEyeComfort
              ? 'bg-[#ede3d4]/50 border-[#d6ccbe]/60 text-[#a6907c] opacity-60'
              : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
          }`}
          title="Detonate 3x3 radius to clear dense clusters"
          aria-label="Bomb Booster"
        >
          <span className="text-base select-none leading-none">💣</span>
          <span className="text-[7px] uppercase font-black tracking-wider leading-none mt-0.5">
            {isBombActive ? 'Active' : 'Bomb'}
          </span>
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm ${
              (progress.inventory?.bomb ?? 0) > 0
                ? 'bg-orange-500 text-white'
                : isDark
                ? 'bg-slate-600 text-white'
                : isEyeComfort
                ? 'bg-[#8c6b4e] text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {(progress.inventory?.bomb ?? 0) > 0 ? progress.inventory?.bomb : '+'}
          </span>
        </button>
      </section>

      {/* =====================================================================
          Bottom Footer: Level Quick Switcher
          ===================================================================== */}
      <footer
        className={`w-full flex items-center justify-between rounded-2xl p-2 px-3 border backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-slate-900/80 border-slate-800/80 text-slate-400'
            : isEyeComfort
            ? 'bg-[#f5ebd7]/90 border-[#d6ccbe]/80 text-[#5c4033] shadow-sm'
            : 'bg-white/90 border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <select
          value={level.id}
          onChange={(e) => onSelectLevel(Number(e.target.value))}
          className={`text-base sm:text-xs rounded-xl px-2.5 py-1.5 min-h-[44px] border focus:outline-none focus:border-cyan-400 cursor-pointer font-medium ${
            isDark
              ? 'bg-slate-800 text-slate-200 border-slate-700'
              : isEyeComfort
              ? 'bg-[#faf5ed] text-[#4a3525] border-[#d6ccbe]'
              : 'bg-slate-100 text-slate-800 border-slate-300'
          }`}
          aria-label="Select puzzle level"
        >
          {allLevels.map((lvl) => (
            <option
              key={lvl.id}
              value={lvl.id}
              className={
                isDark
                  ? 'bg-slate-900 text-white'
                  : isEyeComfort
                  ? 'bg-[#faf5ed] text-[#4a3525]'
                  : 'bg-white text-slate-900'
              }
            >
              Lvl {lvl.id}: {lvl.name} ({lvl.difficulty})
            </option>
          ))}
        </select>

        <span className="text-[11px] font-semibold tracking-tight">
          Tap unblocked arrows to escape
        </span>
      </footer>

      {/* =====================================================================
          Settings & Pause Modal
          ===================================================================== */}
      <SettingsModal
        isOpen={isSettingsOpen && status !== 'won' && !isGameOver}
        settings={settings}
        progress={progress}
        currentLevelId={level.id}
        allLevels={allLevels}
        onClose={onCloseSettings}
        onRestart={onRestart}
        onSelectLevel={onSelectLevel}
        onToggleSound={onToggleSound}
        onToggleHaptics={onToggleHaptics}
        onToggleTheme={onToggleTheme}
        onToggleZenMode={onToggleZenMode}
      />

      {/* =====================================================================
          Shop & Booster Vault Modal
          ===================================================================== */}
      <ShopModal
        isOpen={isShopOpen && status !== 'won' && !isGameOver}
        coins={progress.coins ?? 100}
        inventory={{
          hint: progress.inventory?.hint ?? 3,
          hammer: progress.inventory?.hammer ?? 2,
          bomb: progress.inventory?.bomb ?? 2,
          undo: progress.inventory?.undo ?? 3,
        }}
        isDark={isDark}
        theme={settings.theme}
        onClose={onCloseShop}
        onBuyBooster={onBuyBooster}
        onClaimDailyReward={onClaimDailyReward}
        canClaimDailyReward={canClaimDailyReward}
      />

      {/* =====================================================================
          Victory Modal Overlay
          ===================================================================== */}
      {status === 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border flex flex-col items-center animate-modal-in ${
              isDark
                ? 'bg-slate-900 border-cyan-500/40 text-white'
                : isEyeComfort
                ? 'bg-[#faf5ed] border-[#cbbca7] text-[#4a3525]'
                : 'bg-white border-cyan-400 text-slate-900'
            }`}
          >
            {/* Animated Stars */}
            <div className="flex items-center justify-center gap-2 mb-2 text-3xl">
              {[1, 2, 3].map((star) => {
                const earned = star <= starsEarned;
                return (
                  <span
                    key={star}
                    className={`inline-block ${
                      earned
                        ? `text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] star-pop-${star}`
                        : 'text-slate-600/40'
                    }`}
                  >
                    ★
                  </span>
                );
              })}
            </div>

            <h2 className="text-xl font-black mb-1 tracking-tight">PUZZLE ESCAPED!</h2>
            <p
              className={`text-xs mb-2 ${
                isDark
                  ? 'text-slate-400'
                  : isEyeComfort
                  ? 'text-[#785e49]'
                  : 'text-slate-500'
              }`}
            >
              Cleared in <strong className="text-cyan-500">{movesCount} moves</strong> (Par:{' '}
              {level.parMoves})
            </p>

            {/* Coins Reward */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs mb-4">
              <span>🪙</span>
              <span>+{rewardCoins} Coins Earned!</span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={onNextLevel}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer"
              >
                Next Level ➔
              </button>
              <button
                onClick={onRestart}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : isEyeComfort
                    ? 'bg-[#f0e7db] hover:bg-[#e8decb] text-[#4a3525] border-[#cbbca7]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Replay Level ↻
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          Game Over Modal (Challenge Mode: Out of Lives)
          ===================================================================== */}
      {isGameOver && status !== 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border flex flex-col items-center animate-modal-in ${
              isDark
                ? 'bg-slate-900 border-rose-500/50 text-white'
                : isEyeComfort
                ? 'bg-[#faf5ed] border-rose-300 text-[#4a3525]'
                : 'bg-white border-rose-300 text-slate-900'
            }`}
          >
            <div className="text-4xl mb-2 select-none animate-bounce">
              {isEyeComfort ? '💧' : '💔'}
            </div>
            <h2 className="text-xl font-black mb-1 tracking-tight text-rose-500">
              OUT OF {isEyeComfort ? 'DROPLETS' : 'LIVES'}!
            </h2>
            <p
              className={`text-xs mb-5 ${
                isDark
                  ? 'text-slate-400'
                  : isEyeComfort
                  ? 'text-[#785e49]'
                  : 'text-slate-600'
              }`}
            >
              You tapped blocked arrows too many times on Level {level.id}.
            </p>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={onRestart}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-black text-sm shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
              >
                Try Again ↻
              </button>
              <button
                onClick={onContinueZen}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 border flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30'
                    : isEyeComfort
                    ? 'bg-emerald-100/60 hover:bg-emerald-200/60 text-emerald-800 border-emerald-400/40'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}
              >
                <span>♾️</span> Continue in Zen Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
