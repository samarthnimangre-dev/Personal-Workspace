"use client";

import React from "react";
import { ArrowDown, ArrowUpRight, Terminal, Cpu, Zap } from "lucide-react";
import { profileData, ProfileData } from "@/data/profile";
import { soundFx } from "@/utils/sound";
import { motion } from "motion/react";
import MagneticButton from "@/components/MagneticButton";
import TextScramble from "@/components/TextScramble";

export default function Hero({ profile = profileData }: { profile?: ProfileData }) {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 pt-28 pb-16 text-center max-w-6xl mx-auto"
    >
      {/* Availability Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#060914]/80 border border-white/[0.08] backdrop-blur-xl mb-8 shadow-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        </span>
        <span className="text-[11px] sm:text-xs font-mono tracking-wider text-slate-300">
          <TextScramble text={profile.availabilityStatus} scrambleOnHover={false} />
        </span>
      </motion.div>

      {/* Huge Bold Display Type */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.98] mb-6 max-w-5xl"
      >
        Building{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-violet-400">
          intelligent digital
        </span>{" "}
        systems that actually work.
      </motion.h1>

      {/* Subheadline: Engineer + Builder + Thinker Voice */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-10"
      >
        {profile.heroSubheadline}
      </motion.p>

      {/* Primary Action Buttons with Magnetic Physics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-center gap-4 mb-14 w-full sm:w-auto"
      >
        <MagneticButton pullFactor={0.2}>
          <motion.a
            href="#lab"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => soundFx.playChime(500, 0.08)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-mono text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>Explore my work</span>
            <ArrowUpRight size={15} />
          </motion.a>
        </MagneticButton>

        <MagneticButton pullFactor={0.2}>
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => soundFx.playHover()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#060914]/70 hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-400/40 text-slate-200 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 backdrop-blur-xl cursor-pointer min-h-[44px]"
          >
            <span>Work with me</span>
          </motion.a>
        </MagneticButton>
      </motion.div>

      {/* Subtle Live Telemetry Strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl text-left font-mono text-[11px] text-slate-400"
      >
        <div className="p-3.5 rounded-xl bg-[#060914]/60 border border-white/[0.06] hover:border-cyan-500/30 transition-colors flex items-center gap-2.5 backdrop-blur-md group">
          <Cpu size={14} className="text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
          <div>
            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Craft</div>
            <div className="text-slate-200">
              <TextScramble text="AI & Modern Web" />
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#060914]/60 border border-white/[0.06] hover:border-violet-500/30 transition-colors flex items-center gap-2.5 backdrop-blur-md group">
          <Zap size={14} className="text-violet-400 group-hover:scale-125 transition-transform duration-300" />
          <div>
            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Advantage</div>
            <div className="text-slate-200">
              <TextScramble text="Days, Not Months" />
            </div>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-[#060914]/60 border border-white/[0.06] hover:border-cyan-500/30 transition-colors flex items-center gap-2.5 backdrop-blur-md group">
          <Terminal size={14} className="text-cyan-400" />
          <div>
            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Builder</div>
            <div className="text-slate-200">Sam (17, India)</div>
          </div>
        </div>
      </motion.div>

      {/* Downward Scroll Indicator */}
      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
        href="#statement"
        onClick={() => soundFx.playHover()}
        aria-label="Scroll to vision statement"
        className="mt-14 inline-flex flex-col items-center gap-1 text-slate-500 hover:text-cyan-300 transition-colors"
      >
        <span className="text-[10px] uppercase font-mono tracking-widest">Explore</span>
        <ArrowDown size={14} className="animate-bounce mt-1 text-cyan-400" />
      </motion.a>
    </section>
  );
}
