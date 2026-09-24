// Settings and Pause Modal with audio, haptics, theme, game-mode, and level selector
import React from 'react';
import type { GameSettings } from '../persistence/storage';
import type { UserProgress } from '../engine/types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  progress: UserProgress;
  currentLevelId: number;
  allLevels: readonly { id: number; name: string; difficulty: string }[];
  onClose: () => void;
  onRestart: () => void;
  onSelectLevel: (levelId: number) => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleTheme: () => void;
  onToggleZenMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  progress,
  currentLevelId,
  allLevels,
  onClose,
  onRestart,
  onSelectLevel,
  onToggleSound,
  onToggleHaptics,
  onToggleTheme,
  onToggleZenMode,
}) => {
  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';
  const isEyeComfort = settings.theme === 'eye-comfort';
  const isMinimalWhite = settings.theme === 'minimal-white' || settings.theme === 'light';


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl animate-modal-in flex flex-col max-h-[90vh] overflow-hidden ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white'
            : isEyeComfort
            ? 'bg-[#faf5ed] border-[#cbbca7] text-[#4a3525]'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-base font-black tracking-tight">Pause & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold transition-transform active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] text-[#4a3525]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {/* Toggles Group */}
          <div
            className={`rounded-2xl p-3 space-y-2.5 border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : isEyeComfort
                ? 'bg-[#f5ebd7]/80 border-[#d6ccbe]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{settings.soundMuted ? '🔇' : '🔊'}</span>
                <div>
                  <div className="text-xs font-bold">Sound Effects</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {settings.soundMuted ? 'Muted' : 'Enabled'}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-3.5 py-2 min-h-[44px] min-w-[64px] rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 ${
                  !settings.soundMuted
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {!settings.soundMuted ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-base">📳</span>
                <div>
                  <div className="text-xs font-bold">Haptic Feedback</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {settings.hapticsEnabled ? 'Tactile vibration active' : 'Disabled'}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleHaptics}
                className={`px-3.5 py-2 min-h-[44px] min-w-[64px] rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 ${
                  settings.hapticsEnabled
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {settings.hapticsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-base">{isEyeComfort ? '🍵' : isMinimalWhite ? '☀️' : '🌙'}</span>
                <div>
                  <div className="text-xs font-bold">Display Theme</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isEyeComfort
                      ? 'Eye Comfort (Warm Ivory)'
                      : isMinimalWhite
                      ? 'Minimalist White'
                      : 'Cyber Dark (Obsidian)'}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleTheme}
                className={`px-3.5 py-2 min-h-[44px] min-w-[110px] rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                    : isEyeComfort
                    ? 'bg-[#f0e7db] text-[#4a3525] border border-[#cbbca7]'
                    : 'bg-slate-200 text-slate-800 border border-slate-300'
                }`}
                title="Switch Theme"
              >
                {isEyeComfort ? 'Comfort 🍵' : isMinimalWhite ? 'White ☀️' : 'Dark 🌙'}
              </button>
            </div>


            {/* Game Mode (Lives vs Zen) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-base">{settings.zenMode ? '♾️' : isEyeComfort ? '💧' : '❤️'}</span>
                <div>
                  <div className="text-xs font-bold">Game Mode</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : isEyeComfort ? 'text-[#8c6b4e]' : 'text-slate-500'}`}>
                    {settings.zenMode
                      ? 'Zen Mode (Unlimited)'
                      : isEyeComfort
                      ? 'Classic Challenge (3 Droplets)'
                      : 'Classic Challenge (3 Lives)'}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleZenMode}
                className={`px-3.5 py-2 min-h-[44px] min-w-[70px] rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  settings.zenMode
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                    : isEyeComfort
                    ? 'bg-[#38bdf8] text-slate-950 shadow-sm shadow-sky-400/30'
                    : 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                }`}
              >
                {settings.zenMode ? 'Zen ♾️' : isEyeComfort ? '3 Droplets 💧' : '3 Lives ❤️'}
              </button>
            </div>
          </div>

          {/* Level Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : isEyeComfort ? 'text-[#8c6b4e]' : 'text-slate-500'
                }`}
              >
                Select Level ({progress.completedLevels.length}/{allLevels.length} Cleared)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-1">
              {allLevels.map((lvl) => {
                const isCurrent = lvl.id === currentLevelId;
                const isCompleted = progress.completedLevels.includes(lvl.id);
                const isUnlocked = lvl.id <= Math.max(progress.currentLevel, 1) || isCompleted;

                return (
                  <button
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      onSelectLevel(lvl.id);
                      onClose();
                    }}
                    className={`min-h-[44px] rounded-xl text-xs font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 scale-105'
                        : isCompleted
                        ? isDark
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                          : isEyeComfort
                          ? 'bg-emerald-100/60 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : isUnlocked
                        ? isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : isEyeComfort
                          ? 'bg-[#f0e7db] hover:bg-[#e8decb] text-[#4a3525]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : isDark
                        ? 'bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-50'
                        : isEyeComfort
                        ? 'bg-[#ede3d4]/40 text-[#a6907c] cursor-not-allowed opacity-50'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>{lvl.id}</span>
                    {isCompleted && <span className="text-[8px] leading-none">★</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-3 border-t border-slate-700/40 flex gap-2">
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : isEyeComfort
                ? 'bg-[#f0e7db] hover:bg-[#e8decb] text-[#4a3525] border border-[#cbbca7]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
            }`}
          >
            <span>↻</span> Restart Level
          </button>
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-950/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            Resume ▶
          </button>
        </div>
      </div>
    </div>
  );
};
