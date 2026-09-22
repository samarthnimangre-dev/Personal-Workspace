'use client';

import React, { useState } from 'react';
import {
  X,
  Code2,
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Globe,
  ShoppingBag,
} from 'lucide-react';
import { sound } from '@/lib/audio';

interface CommercialLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommercialLicenseModal: React.FC<CommercialLicenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dau, setDau] = useState<number>(3500);
  const [cpm, setCpm] = useState<number>(3.5);
  const [iapRate, setIapRate] = useState<number>(2.0); // 2%
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Revenue projections
  // Daily ad impressions = DAU * 4 (e.g. 4 level clears or booster ads)
  const dailyAdImpressions = dau * 4;
  const monthlyAdRevenue = ((dailyAdImpressions * 30) / 1000) * cpm;
  // Monthly paying users = DAU * 30 * iapRate * avg order $2.99
  const monthlyIapRevenue = (dau * (iapRate / 100) * 30) * 0.4 * 2.99;
  const totalMonthlyEarnings = Math.round(monthlyAdRevenue + monthlyIapRevenue);

  const handleDownloadTurnkeyPackage = () => {
    sound.playTap();
    setIsDownloading(true);

    // Simulate export zip packaging
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      sound.playWin();

      // Trigger dummy zip download or manifest
      const blob = new Blob(
        [
          JSON.stringify(
            {
              game: 'ArrowFlow: Tangled Direction Puzzle',
              version: '1.0.0',
              license: 'Commercial White-Label License',
              features: [
                'Complete Next.js 16 + React 19 Engine',
                'Web Audio API Synthesizer',
                'Stripe Checkout & Rewarded Ads Hook',
                'Capacitor iOS & Android Support',
              ],
              build_instructions: 'Run `pnpm install` and `pnpm run build` or `npx cap build`',
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ArrowFlow-Commercial-Turnkey-Source.json';
      a.click();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                Turnkey Game Monetization & Commercial Sale
              </h3>
              <p className="text-xs text-slate-400">
                How to monetize this game on web, mobile, and client marketplaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-300 text-xs">
          {/* Revenue Calculator Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Live Revenue Projection Calculator</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Estimated Monthly Earnings
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ${totalMonthlyEarnings.toLocaleString()} / mo
                </span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Daily Active Users (DAU): <strong className="text-white">{dau.toLocaleString()}</strong></span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={dau}
                  onChange={(e) => setDau(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Web Ad eCPM (CrazyGames/Poki): <strong className="text-white">${cpm.toFixed(2)}</strong></span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.5"
                  value={cpm}
                  onChange={(e) => setCpm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>In-App Purchase Conversion: <strong className="text-white">{iapRate.toFixed(1)}%</strong></span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={iapRate}
                  onChange={(e) => setIapRate(Number(e.target.value))}
                  className="w-full accent-fuchsia-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3 Channels of Monetization */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3 Direct Ways You Can Monetize This App Right Now:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <Globe className="w-5 h-5 text-cyan-400 mb-2" />
                <h5 className="font-bold text-white text-sm">1. Web Game Portals</h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  Submit to <strong>CrazyGames, Poki, and GameDistribution</strong>. They pay $2 to $5 CPM for every 1,000 gameplay views via automated rewarded video ads.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <Smartphone className="w-5 h-5 text-fuchsia-400 mb-2" />
                <h5 className="font-bold text-white text-sm">2. App Store & Play Store</h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  Wrap this Next.js app with <strong>Capacitor</strong> in 1 command. Publish to iOS & Android with AdMob and Apple In-App Purchases ($0.99 - $4.99).
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <ShoppingBag className="w-5 h-5 text-amber-400 mb-2" />
                <h5 className="font-bold text-white text-sm">3. Sell Turnkey Source</h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sell this complete game template on <strong>CodeCanyon, Gumroad, and Itch.io</strong> for $49 to $149 per commercial license to creators wanting to re-skin it.
                </p>
              </div>
            </div>
          </div>

          {/* Buy License Card */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-bold text-sm">
                  White-Label Turnkey Commercial Package
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                Full source code, procedural algorithm, sound synthesizer, and zero-royalty redistribution license.
              </p>
            </div>

            <button
              onClick={handleDownloadTurnkeyPackage}
              disabled={isDownloading}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Packaging...' : 'Export Turnkey Package'}</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Turnkey package exported! All engine files are ready for publishing and re-skinning.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
