// Shop & Booster Refill Modal: Allows players to spend earned coins on tactical boosters
import React, { useState } from 'react';
import type { BoosterType, GameTheme } from '../engine/types';

interface ShopModalProps {
  isOpen: boolean;
  coins: number;
  inventory: Readonly<Record<BoosterType, number>>;
  isDark?: boolean;
  theme?: GameTheme;
  onClose: () => void;
  onBuyBooster: (type: BoosterType) => boolean;
  onClaimDailyReward: () => void;
  canClaimDailyReward: boolean;
}

interface BoosterPackConfig {
  type: BoosterType;
  name: string;
  icon: string;
  count: number;
  cost: number;
  description: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

const BOOSTER_PACKS: readonly BoosterPackConfig[] = [
  {
    type: 'hint',
    name: 'Smart Hint',
    icon: '💡',
    count: 3,
    cost: 50,
    description: 'Solves current board state & reveals guaranteed escape move',
    colorBorder: 'border-amber-500/40',
    colorBg: 'bg-amber-500/10',
    colorText: 'text-amber-400',
  },
  {
    type: 'hammer',
    name: 'Sledgehammer',
    icon: '🔨',
    count: 2,
    cost: 75,
    description: 'Shatters any single blocking arrow instantly with laser burst',
    colorBorder: 'border-rose-500/40',
    colorBg: 'bg-rose-500/10',
    colorText: 'text-rose-400',
  },
  {
    type: 'bomb',
    name: 'Dynamite Bomb',
    icon: '💣',
    count: 2,
    cost: 75,
    description: 'Triggers a 3x3 explosive radius clearing dense clusters',
    colorBorder: 'border-orange-500/40',
    colorBg: 'bg-orange-500/10',
    colorText: 'text-orange-400',
  },
  {
    type: 'undo',
    name: 'Time-Rewind',
    icon: '↩️',
    count: 3,
    cost: 50,
    description: 'Reverts miscalculated taps and restores lost lives',
    colorBorder: 'border-cyan-500/40',
    colorBg: 'bg-cyan-500/10',
    colorText: 'text-cyan-400',
  },
];

export const ShopModal: React.FC<ShopModalProps> = React.memo(({
  isOpen,
  coins,
  inventory,
  isDark: isDarkProp = true,
  theme,
  onClose,
  onBuyBooster,
  onClaimDailyReward,
  canClaimDailyReward,
}) => {
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const isDark = theme ? theme === 'dark' : Boolean(isDarkProp);
  const isEyeComfort = theme === 'eye-comfort';

  const handleBuy = (type: BoosterType, cost: number, name: string) => {
    if (coins < cost) {
      setFeedback({
        message: `Need ${cost - coins} more Coins to buy ${name}! Clear puzzles to earn more.`,
        success: false,
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const bought = onBuyBooster(type);
    if (bought) {
      setFeedback({
        message: `Purchased ${name}! Boosters added to inventory.`,
        success: true,
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleClaim = () => {
    onClaimDailyReward();
    setFeedback({
      message: '🎁 Claimed +100 Free Coins reward!',
      success: true,
    });
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl animate-modal-in flex flex-col max-h-[92vh] overflow-hidden ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white'
            : isEyeComfort
            ? 'bg-[#faf5ed] border-[#cbbca7] text-[#4a3525]'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Balance */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none">Booster Vault</h2>
              <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : isEyeComfort ? 'text-[#8c6b4e]' : 'text-slate-500'}`}>
                Refill tactical power-ups
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Coins Balance Chip */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black shadow-sm ${
                isDark
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : isEyeComfort
                  ? 'bg-[#f0e7db] border-[#cbbca7] text-[#634832]'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <span>🪙</span>
              <span>{coins}</span>
            </div>

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-transform active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : isEyeComfort
                  ? 'bg-[#f0e7db] hover:bg-[#e8decb] text-[#4a3525]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="Close store"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`my-2 px-3 py-2 rounded-xl text-xs font-bold text-center animate-fade-in border flex items-center justify-center gap-1.5 ${
              feedback.success
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{feedback.success ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Booster Cards List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {BOOSTER_PACKS.map((pack) => {
            const owned = inventory[pack.type] ?? 0;
            const canAfford = coins >= pack.cost;

            return (
              <div
                key={pack.type}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/60'
                    : isEyeComfort
                    ? 'bg-[#f5ebd7]/80 border-[#d6ccbe]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border shadow-inner ${pack.colorBg} ${pack.colorBorder}`}
                  >
                    {pack.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-tight">{pack.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${pack.colorBorder} ${pack.colorText}`}
                      >
                        +{pack.count}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] leading-tight line-clamp-1 ${
                        isDark ? 'text-slate-400' : isEyeComfort ? 'text-[#785e49]' : 'text-slate-500'
                      }`}
                    >
                      {pack.description}
                    </span>
                    <span
                      className={`text-[9px] font-bold mt-0.5 ${
                        isDark ? 'text-slate-500' : isEyeComfort ? 'text-[#8c6b4e]' : 'text-slate-400'
                      }`}
                    >
                      In stock:{' '}
                      <strong className={isDark ? 'text-slate-300' : isEyeComfort ? 'text-[#4a3525]' : 'text-slate-700'}>
                        {owned}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(pack.type, pack.cost, pack.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 transition-transform active:scale-95 shadow-md ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-amber-950/40'
                      : 'bg-slate-700/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  aria-label={`Buy ${pack.name} for ${pack.cost} coins`}
                >
                  <span>🪙</span>
                  <span>{pack.cost}</span>
                </button>
              </div>
            );
          })}

          {/* Daily Free Reward Booster Box */}
          <div
            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/40'
                : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                🎁
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-indigo-400">Daily Gift Stash</span>
                <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  +100 Free Coins bonus boost
                </span>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={!canClaimDailyReward}
              className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-transform active:scale-95 ${
                canClaimDailyReward
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-700/40 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              {canClaimDailyReward ? 'Claim 🎁' : 'Claimed ✓'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/40 flex justify-between items-center text-[10px]">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Earn coins by escaping campaign puzzles
          </span>
          <button
            onClick={onClose}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Resume Game ➔
          </button>
        </div>
      </div>
    </div>
  );
});

ShopModal.displayName = 'ShopModal';
