"use client";

import React from "react";
import { profileData } from "@/data/profile";
import { soundFx } from "@/utils/sound";
import { ArrowUp, Terminal } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    soundFx.playChime(520, 0.06);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerTelemetry = () => {
    soundFx.playChime(660, 0.08);
    window.dispatchEvent(new CustomEvent("toggle-telemetry"));
  };

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#04060c]/90 backdrop-blur-md px-4 sm:px-6 py-12 text-xs font-mono text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Location */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span className="font-bold text-white tracking-wider">SAM CODES</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{profileData.fullName}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {profileData.location} · {profileData.title}
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] uppercase tracking-wider text-slate-400">
          <a href="#capabilities" className="hover:text-cyan-300 transition-colors">
            Capabilities
          </a>
          <a href="#lab" className="hover:text-cyan-300 transition-colors">
            The Lab
          </a>
          <a href="#process" className="hover:text-cyan-300 transition-colors">
            Process
          </a>
          <a href="#about" className="hover:text-cyan-300 transition-colors">
            About
          </a>
          <a href="#services" className="hover:text-cyan-300 transition-colors">
            Services
          </a>
          <a href="#contact" className="hover:text-cyan-300 transition-colors">
            Contact
          </a>
        </div>

        {/* Actions: Telemetry Trigger & Back to Top */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerTelemetry}
            title="Toggle Developer Telemetry (Shift + D)"
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-cyan-300 text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Terminal size={12} />
            <span>Shift+D</span>
          </button>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top of page"
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div>
          © {new Date().getFullYear()} {profileData.brandName}. All rights reserved. Zero fake claims.
        </div>
        <div className="text-slate-500">
          Engineered with Next.js 16, React 19 &amp; Tailwind CSS v4
        </div>
      </div>
    </footer>
  );
}
