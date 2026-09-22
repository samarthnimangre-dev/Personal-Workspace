'use client';

import React, { useState } from 'react';
import { X, Coins, Gem, Crown, Hammer, Lightbulb, RotateCcw, Sparkles, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { UserEconomy } from '@/types/game';
import { sound } from '@/lib/audio';

interface ShopModalProps {
  isOpen: boolean;
  economy: UserEconomy;
  onUpdateEconomy: (updater: (prev: UserEconomy) => UserEconomy) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  economy,
  onUpdateEconomy,
  onClose,
}) => {
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [useLiveStripe, setUseLiveStripe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleBuyWithMoney = async (itemKey: string, title: string, price: string) => {
    sound.playTap();

    if (useLiveStripe) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemKey, price }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.error('Stripe error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    // Instant Sandbox / Turnkey Simulation Mode:
    fulfillPurchase(itemKey);
    sound.playCoin();
    setPurchaseSuccessMessage(`Successfully purchased ${title}! Boosters added to inventory.`);
    setTimeout(() => setPurchaseSuccessMessage(null), 3500);
  };

  const fulfillPurchase = (itemKey: string) => {
    if (itemKey === 'pack-coins-starter') {
      onUpdateEconomy((prev) => ({ ...prev, coins: prev.coins + 500 }));
    } else if (itemKey === 'pack-gems-vault') {
      onUpdateEconomy((prev) => ({
        ...prev,
        coins: prev.coins + 2500,
        gems: prev.gems + 200,
        hammers: prev.hammers + 5,
        hints: prev.hints + 5,
      }));
    } else if (itemKey === 'pack-vip-pass') {
      onUpdateEconomy((prev) => ({
        ...prev,
        vipUnlocked: true,
        coins: prev.coins + 5000,
        gems: prev.gems + 500,
        hammers: prev.hammers + 10,
        hints: prev.hints + 10,
        magnets: prev.magnets + 10,
        undos: prev.undos + 20,
      }));
    }
  };

  // Buying boosters with in-game currency
  const buyBoosterWithCoins = (type: 'hammer' | 'hint' | 'undo' | 'magnet', costCoins: number) => {
    if (economy.coins < costCoins) {
      sound.playBlocked();
      return;
    }
    sound.playCoin();
    onUpdateEconomy((prev) => ({
      ...prev,
      coins: prev.coins - costCoins,
      [type === 'hammer'
        ? 'hammers'
        : type === 'hint'
        ? 'hints'
        : type === 'undo'
        ? 'undos'
        : 'magnets']:
        prev[
          type === 'hammer'
            ? 'hammers'
            : type === 'hint'
            ? 'hints'
            : type === 'undo'
            ? 'undos'
            : 'magnets'
        ] + 3,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <span>In-Game Store & VIP Pass</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upgrade your toolkit and unlock infinite puzzles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {purchaseSuccessMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 p-3 text-xs text-emerald-300 font-bold flex items-center gap-2 px-5 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{purchaseSuccessMessage}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* VIP Founder Pass Banner */}
          <div className="relative rounded-2xl p-5 bg-gradient-to-r from-amber-600/30 via-purple-600/30 to-indigo-600/30 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                  BEST VALUE
                </span>
                <h4 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>VIP Founder Pass</span>
                </h4>
                <ul className="text-xs text-amber-200/90 mt-2 space-y-1">
                  <li>✨ No Forced Ads Forever</li>
                  <li>🔨 10x Free Hammers, 10x Hints, 10x Magnets</li>
                  <li>💎 +5,000 Coins & +500 Gems Instant Drop</li>
                  <li>⚡ Unlocks Gold Obsidian Luxury Theme</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyWithMoney('pack-vip-pass', 'VIP Founder Pass', '$4.99')}
                disabled={isLoading || economy.vipUnlocked}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-900/50 transition-all active:scale-95 whitespace-nowrap"
              >
                {economy.vipUnlocked ? 'UNLOCKED' : '$4.99 Buy'}
              </button>
            </div>
          </div>

          {/* Real Money Coin & Gem Packs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Currency & Booster Bundles (Stripe Ready)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Starter Pack */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Starter Bag</h5>
                    <p className="text-xs text-slate-400">500 Gold Coins</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyWithMoney('pack-coins-starter', 'Starter Bag', '$0.99')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow active:scale-95"
                >
                  $0.99
                </button>
              </div>

              {/* Vault Pack */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center">
                    <Gem className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Master Vault</h5>
                    <p className="text-xs text-slate-400">2,500 Coins + 200 Gems</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyWithMoney('pack-gems-vault', 'Master Vault', '$2.99')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow active:scale-95"
                >
                  $2.99
                </button>
              </div>
            </div>
          </div>

          {/* In-Game Booster Shop (Coins -> Boosters) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Trade Coins for In-Game Boosters
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Buy 3 Hammers */}
              <button
                onClick={() => buyBoosterWithCoins('hammer', 150)}
                disabled={economy.coins < 150}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 disabled:opacity-50 transition-all text-center group"
              >
                <Hammer className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-white">+3 Hammers</span>
                <span className="text-[10px] text-amber-400 font-semibold mt-1">150 Coins</span>
              </button>

              {/* Buy 3 Hints */}
              <button
                onClick={() => buyBoosterWithCoins('hint', 100)}
                disabled={economy.coins < 100}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 disabled:opacity-50 transition-all text-center group"
              >
                <Lightbulb className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-white">+3 Hints</span>
                <span className="text-[10px] text-amber-400 font-semibold mt-1">100 Coins</span>
              </button>

              {/* Buy 3 Undos */}
              <button
                onClick={() => buyBoosterWithCoins('undo', 80)}
                disabled={economy.coins < 80}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 disabled:opacity-50 transition-all text-center group"
              >
                <RotateCcw className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-white">+3 Undos</span>
                <span className="text-[10px] text-amber-400 font-semibold mt-1">80 Coins</span>
              </button>

              {/* Buy 3 Magnets */}
              <button
                onClick={() => buyBoosterWithCoins('magnet', 250)}
                disabled={economy.coins < 250}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-fuchsia-500/40 disabled:opacity-50 transition-all text-center group"
              >
                <Sparkles className="w-6 h-6 text-fuchsia-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-white">+3 Magnets</span>
                <span className="text-[10px] text-amber-400 font-semibold mt-1">250 Coins</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Stripe Mode Switch */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant Sandbox Fulfillment Enabled</span>
          </div>
          <button
            onClick={() => setUseLiveStripe(!useLiveStripe)}
            className="text-[11px] text-cyan-400 hover:underline"
          >
            Mode: {useLiveStripe ? 'Live Stripe API' : 'Instant Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};
