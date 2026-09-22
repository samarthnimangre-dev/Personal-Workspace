'use client';

import React from 'react';
import { X, Check, Lock, Palette, Coins, Gem } from 'lucide-react';
import { THEMES } from '@/lib/themes';
import { UserEconomy } from '@/types/game';
import { sound } from '@/lib/audio';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  economy: UserEconomy;
  onSelectTheme: (themeId: string) => void;
  onUnlockTheme: (themeId: string, costCoins: number, costGems: number) => void;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  economy,
  onSelectTheme,
  onUnlockTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-black text-white">Visual Themes & Skins</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="p-5 overflow-y-auto space-y-3 max-h-[70vh]">
          {Object.values(THEMES).map((theme) => {
            const isUnlocked = economy.unlockedThemes.includes(theme.id) || theme.priceCoins === 0;
            const isActive = economy.activeTheme === theme.id;
            const canAfford =
              economy.coins >= theme.priceCoins && economy.gems >= theme.priceGems;

            return (
              <div
                key={theme.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isActive
                    ? 'border-cyan-400 bg-slate-800/80 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs"
                    style={{
                      borderColor: theme.accentColor,
                      color: theme.accentColor,
                      boxShadow: `0 0 10px ${theme.accentColor}33`,
                    }}
                  >
                    ➔
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{theme.name}</span>
                      {isActive && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-black">
                          ACTIVE
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">{theme.tagline}</p>
                  </div>
                </div>

                {/* Action button */}
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      sound.playTap();
                      onSelectTheme(theme.id);
                    }}
                    disabled={isActive}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                      isActive
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }`}
                  >
                    {isActive ? 'Selected' : 'Equip'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sound.playCoin();
                        onUnlockTheme(theme.id, theme.priceCoins, theme.priceGems);
                      } else {
                        sound.playBlocked();
                      }
                    }}
                    disabled={!canAfford}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {theme.priceCoins > 0 && `${theme.priceCoins} Coins`}
                      {theme.priceGems > 0 && ` + ${theme.priceGems} Gems`}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
