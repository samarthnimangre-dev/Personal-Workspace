"use client";

import React, { useState } from "react";
import {
  capabilitiesData,
  buildingWithStack,
  exploringStack,
  Capability,
  TechItem,
} from "@/data/capabilities";
import { soundFx } from "@/utils/sound";
import SpotlightCard from "@/components/SpotlightCard";
import MotionReveal from "@/components/MotionReveal";
import { motion } from "motion/react";
import {
  Brain,
  Zap,
  Bot,
  GitBranch,
  Globe,
  Network,
  Flame,
  Sparkles,
  LucideIcon,
  CheckCircle2,
  Compass,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  Zap,
  Bot,
  GitFork: GitBranch,
  Globe,
  Network,
  Flame,
  Sparkles,
};

type ViewMode = "capabilities" | "stack";

export default function CapabilitiesSection({
  capabilities = capabilitiesData,
  buildingWith = buildingWithStack,
  exploring = exploringStack,
}: {
  capabilities?: Capability[];
  buildingWith?: TechItem[];
  exploring?: TechItem[];
}) {
  const [activeTab, setActiveTab] = useState<ViewMode>("capabilities");

  const handleTabChange = (tab: ViewMode) => {
    soundFx.playHover();
    setActiveTab(tab);
  };

  return (
    <section
      id="capabilities"
      aria-label="Capabilities and Technologies"
      className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]"
    >
      <MotionReveal className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300 mb-4 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          Build Environment &amp; Capabilities
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Technologies I Work With
        </h2>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl">
          Practical systems I engineer for clients and collaborators, alongside the frontier tools I am actively exploring.
        </p>

        {/* View Switcher Pill */}
        <div className="mt-8 inline-flex p-1 rounded-full bg-[#060914]/80 border border-white/[0.08] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleTabChange("capabilities")}
            className="relative px-5 py-2 rounded-full text-xs font-mono transition-colors cursor-pointer"
          >
            {activeTab === "capabilities" && (
              <motion.div
                layoutId="capTabPill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 shadow-md shadow-cyan-500/25 border border-cyan-300"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 ${
                activeTab === "capabilities" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              What I Build
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("stack")}
            className="relative px-5 py-2 rounded-full text-xs font-mono transition-colors cursor-pointer"
          >
            {activeTab === "stack" && (
              <motion.div
                layoutId="capTabPill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 shadow-md shadow-cyan-500/25 border border-cyan-300"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 ${
                activeTab === "stack" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Stack &amp; Environment
            </span>
          </button>
        </div>
      </MotionReveal>

      {/* Tab 1: Practical Capabilities (What I Can Build) */}
      {activeTab === "capabilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
          {capabilities.map((cap: Capability, idx: number) => {
            const Icon = ICON_MAP[cap.icon] || Sparkles;
            const isViolet = idx % 2 === 1;

            return (
              <MotionReveal key={cap.id} delay={idx * 0.05}>
                <SpotlightCard
                  onMouseEnter={() => soundFx.playHover()}
                  spotlightColor={isViolet ? "rgba(139, 92, 246, 0.12)" : "rgba(0, 240, 255, 0.12)"}
                  borderColor={isViolet ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 240, 255, 0.3)"}
                  className="h-full flex flex-col justify-between group cursor-default p-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
                          isViolet
                            ? "bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:bg-violet-500/20"
                            : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20"
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400">
                        {cap.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                      {cap.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                      {cap.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.04]">
                      {cap.highlights.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.05] text-slate-400 group-hover:text-slate-300 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </MotionReveal>
            );
          })}
        </div>
      )}

      {/* Tab 2: Stack Breakdown (Building With vs Exploring) */}
      {activeTab === "stack" && (
        <div className="space-y-10 animate-in fade-in duration-300">
          {/* Section A: Building With */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-4">
              <CheckCircle2 size={14} />
              <span>Building With (Primary Production Stack)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {buildingWith.map((item: TechItem, idx: number) => (
                <SpotlightCard
                  key={idx}
                  spotlightColor="rgba(52, 211, 153, 0.12)"
                  className="p-5 h-full flex flex-col justify-between group cursor-default"
                >
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 mb-3 inline-block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Section B: Exploring */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-4">
              <Compass size={14} />
              <span>Exploring (Active Research &amp; Experiments)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {exploring.map((item: TechItem, idx: number) => (
                <SpotlightCard
                  key={idx}
                  spotlightColor="rgba(168, 85, 247, 0.12)"
                  className="p-5 h-full flex flex-col justify-between group cursor-default"
                >
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3 inline-block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
