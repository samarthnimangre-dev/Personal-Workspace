"use client";

import React, { useState } from "react";
import {
  motion,
} from "motion/react";
import {
  projectsData,
  experimentsData,
  Project,
  LabExperiment,
  ProjectEvidenceMetric,
} from "@/data/projects";
import { soundFx } from "@/utils/sound";
import SpotlightCard from "@/components/SpotlightCard";
import MotionReveal from "@/components/MotionReveal";
import {
  FlaskConical,
  Sparkles,
  ArrowUpRight,
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "AI Application",
  "Agentic Workflow",
  "Automation",
  "Web System",
  "Prototype",
] as const;

const CATEGORY_MAP: Record<string, string[]> = {
  "All": [],
  "AI Application": ["AI Application", "AI App", "AI Chatbots & Assistants"],
  "Agentic Workflow": ["Agentic Workflow", "AI Agent System", "Agent Workflow"],
  "Automation": ["Automation", "Workflow Automation", "Workflow & Business Automation"],
  "Web System": ["Web System", "Web Platform", "Web Experience", "Websites & Web Applications"],
  "Prototype": ["Prototype", "Experimental Prototype", "Developer Tool", "Rapid Prototypes & MVPs"],
};

function matchesCategory(itemCategory: string | undefined, selectedTab: string): boolean {
  if (selectedTab === "All") return true;
  if (!itemCategory) return false;
  if (itemCategory.toLowerCase() === selectedTab.toLowerCase()) return true;
  const synonyms = CATEGORY_MAP[selectedTab] || [];
  return synonyms.some((s) => s.toLowerCase() === itemCategory.toLowerCase());
}

export default function LabSection({
  projects = projectsData,
  experiments = experimentsData,
}: {
  projects?: Project[];
  experiments?: LabExperiment[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [blueprintModalOpen, setBlueprintModalOpen] = useState<boolean>(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Filter completed projects with category normalization
  const filteredProjects = projects.filter((project: Project) =>
    matchesCategory(project.category, selectedCategory)
  );

  // Filter active lab experiments with category normalization
  const filteredExperiments = experiments.filter((exp: LabExperiment) =>
    matchesCategory(exp.category, selectedCategory)
  );

  const handleTabChange = (category: string) => {
    soundFx.playHover();
    setSelectedCategory(category);
  };

  return (
    <section
      id="lab"
      aria-label="The Lab & Projects"
      className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]"
    >
      {/* Section Header */}
      <MotionReveal className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300 mb-4 uppercase tracking-wider">
          <FlaskConical size={13} className="text-cyan-400 animate-pulse" />
          The Digital Laboratory
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          The Lab
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed mb-2">
          Things I&apos;m building, testing, breaking, and learning from.
        </p>

        <p className="text-xs sm:text-sm font-mono text-slate-400">
          Experiments in progress. Projects will appear here as they become ready. Working systems over hypothetical claims.
        </p>
      </MotionReveal>

      {/* Category Filter Pills with Fluid Motion Slider */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-12">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleTabChange(category)}
              className="relative px-4 py-2 rounded-full text-xs font-mono transition-colors cursor-pointer text-slate-300 hover:text-white min-h-[44px] flex items-center justify-center"
            >
              {isSelected && (
                <motion.div
                  layoutId="activeLabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 shadow-md shadow-cyan-500/25 border border-cyan-300"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${isSelected ? "text-slate-950 font-bold" : "text-slate-400"}`}>
                {category}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. When completed projects exist, render the verified project grid */}
      {filteredProjects.length > 0 && (
        <div className="mb-12">
          {filteredExperiments.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Verified Systems &amp; Case Studies ({filteredProjects.length})
              </h3>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj: Project) => (
              <SpotlightCard
                key={proj.slug}
                onClick={() => {
                  soundFx.playChime(440, 0.05);
                  setActiveProject(proj);
                }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-sky-500/30 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                    <span className="text-sky-400">{proj.category}</span>
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {proj.shortDescription}
                  </p>

                  {/* Evidence Metrics (only if genuine data exists) */}
                  {proj.metrics && proj.metrics.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {proj.metrics.map((m: ProjectEvidenceMetric, mIdx: number) => (
                        <div key={mIdx}>
                          <div className="text-slate-500 text-[9px] uppercase">{m.label}</div>
                          <div className="text-emerald-400 font-bold">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.slice(0, 3).map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.02] text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowUpRight size={14} className="text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      )}

      {/* 2. Active Experiments State */}
      {filteredExperiments.length > 0 && (
        <div className="space-y-6 mb-12">
          {filteredProjects.length > 0 && (
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Active R&amp;D Experiments in Progress ({filteredExperiments.length})
              </h3>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredExperiments.map((exp: LabExperiment, idx: number) => (
              <MotionReveal key={exp.id} delay={idx * 0.08}>
                <SpotlightCard
                  onMouseEnter={() => soundFx.playHover()}
                  spotlightColor="rgba(56, 189, 248, 0.12)"
                  className="p-6 h-full flex flex-col justify-between group cursor-default"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] text-sky-400 border border-white/[0.08] tracking-wider uppercase">
                        {exp.state}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {exp.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                      {exp.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                      {exp.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.05]">
                      {exp.techStack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.02] text-slate-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </MotionReveal>
            ))}
          </div>
        </div>
      )}

      {/* 3. Transparent Blueprint & Collaboration Banner */}
      {(filteredProjects.length > 0 || filteredExperiments.length > 0) && (
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] p-8 sm:p-10 text-center max-w-3xl mx-auto overflow-hidden relative mb-12">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Working Systems Over Hypothetical Claims
          </h3>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto mb-6">
            When projects are completed, they are published here with complete architectural blueprints, source repositories, and verifiable outcomes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                soundFx.playChime(520, 0.08);
                setBlueprintModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-slate-200 hover:text-white text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Code2 size={15} className="text-sky-400" />
              <span>Preview Case Study Blueprint</span>
            </button>

            <a
              href="#contact"
              onClick={() => soundFx.playHover()}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20 min-h-[44px]"
            >
              <span>Propose a build with Sam</span>
              <ArrowUpRight size={14} />
            </a>
          </div>

          {/* Standards Guarantee */}
          <div className="mt-8 pt-6 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-mono text-[11px] text-slate-400">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Integrity</span>
              <span className="text-slate-200">Zero Fabricated Proof</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Engineering</span>
              <span className="text-slate-200">Production Performance</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Handoff</span>
              <span className="text-slate-200">Clean Documentation</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Empty Lab Active R&D State */}
      {filteredProjects.length === 0 && filteredExperiments.length === 0 && (
        <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] p-8 sm:p-12 text-center max-w-3xl mx-auto overflow-hidden">
          {/* Subtle ambient glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>LAB_STATUS: ACTIVE_R&amp;D</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Active R&amp;D in Progress
          </h3>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
            Case studies, production benchmarks, and interactive experiments are undergoing testing before release. In line with the zero-fabrication standard, only genuinely verified systems are published here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                soundFx.playChime(520, 0.08);
                setBlueprintModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-slate-200 hover:text-white text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Code2 size={15} className="text-sky-400" />
              <span>Preview Case Study Blueprint</span>
            </button>

            <a
              href="#contact"
              onClick={() => soundFx.playHover()}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20 min-h-[44px]"
            >
              <span>Propose a build with Sam</span>
              <ArrowUpRight size={14} />
            </a>
          </div>

          {/* Standards Guarantee */}
          <div className="mt-10 pt-8 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-mono text-[11px] text-slate-400">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Standard</span>
              <span className="text-slate-200">Zero Fabricated Proof</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Engineering</span>
              <span className="text-slate-200">Production Performance</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Handoff</span>
              <span className="text-slate-200">Clean Documentation</span>
            </div>
          </div>
        </div>
      )}

      {/* Blueprint Preview Modal */}
      {blueprintModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0a0f1d] border border-white/[0.12] p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setBlueprintModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
              <Cpu size={14} />
              <span>SCHEMA // CASE_STUDY_STANDARD</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Production Case Study Standard
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Every system published in The Lab complies with this clear engineering schema. No vague summaries or fabricated metrics.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-sky-400 font-bold mb-1 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-sky-400" />
                  <span>1. PROBLEM FORMULATION</span>
                </div>
                <div className="text-slate-400">
                  Explicit definition of the operational bottleneck or challenge solved for the user.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
                  <Layers size={13} className="text-emerald-400" />
                  <span>2. ARCHITECTURE &amp; WORKFLOW</span>
                </div>
                <div className="text-slate-400">
                  Clear description of the API connections, database schema, AI prompts, and error fallbacks.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-indigo-400 font-bold mb-1 flex items-center gap-2">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>3. EVIDENCE &amp; PRACTICAL OUTCOMES</span>
                </div>
                <div className="text-slate-400">
                  Hours saved, manual tasks eliminated, or quantifiable workflow step improvements.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-purple-400 font-bold mb-1 flex items-center gap-2">
                  <ExternalLink size={13} className="text-purple-400" />
                  <span>4. REPRODUCIBILITY &amp; LIVE DEMO</span>
                </div>
                <div className="text-slate-400">
                  Working live URL, GitHub repository, or reproducible video walkthrough for client verification.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06] flex justify-end">
              <button
                type="button"
                onClick={() => setBlueprintModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-medium text-xs hover:bg-sky-300 transition-colors cursor-pointer min-h-[44px]"
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Populated Project Modal with Evidence Metrics Support */}
      {activeProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0a0f1d] border border-white/[0.12] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveProject(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <span className="text-xs font-mono text-sky-400 uppercase tracking-wider block mb-2">
              {activeProject.category}
            </span>

            <h3 className="text-2xl font-bold text-white mb-2">
              {activeProject.title}
            </h3>

            <p className="text-sm text-slate-300 mb-6">
              {activeProject.fullDescription || activeProject.shortDescription}
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400 font-mono font-bold block mb-1">Problem</span>
                <p className="text-slate-300">{activeProject.problem}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-sky-400 font-mono font-bold block mb-1">Approach</span>
                <p className="text-slate-300">{activeProject.approach}</p>
              </div>

              {activeProject.metrics && activeProject.metrics.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-emerald-400 font-mono font-bold block mb-2">
                    Verified Outcomes &amp; Evidence
                  </span>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    {activeProject.metrics.map((m, mIdx) => (
                      <div key={mIdx}>
                        <div className="text-slate-400 text-[10px]">{m.label}</div>
                        <div className="text-white font-bold">{m.value}</div>
                        {m.evidenceNotes && (
                          <div className="text-slate-500 text-[9px] mt-0.5">{m.evidenceNotes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-indigo-400 font-mono font-bold block mb-1">Result &amp; Lessons</span>
                <p className="text-slate-300">{activeProject.result}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
              {activeProject.liveUrl && (
                <a
                  href={activeProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-full bg-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-sky-400 transition-colors min-h-[44px]"
                >
                  <span>Launch Live Demo</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="px-5 py-2.5 rounded-full bg-white/[0.06] text-slate-300 text-xs hover:text-white transition-colors ml-auto cursor-pointer min-h-[44px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
