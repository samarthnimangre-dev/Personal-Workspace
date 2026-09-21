"use client";

import React, { useState } from "react";
import { socialsData, CONTACT_CONFIG, SocialLink } from "@/data/socials";
import { soundFx } from "@/utils/sound";
import SpotlightCard from "@/components/SpotlightCard";
import MotionReveal from "@/components/MotionReveal";
import {
  Mail,
  Copy,
  Check,
  Send,
  Sparkles,
  MessageSquare,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics-client";

// Crisp inline SVGs for brand socials
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l16 16m0-16L4 20" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
      <circle cx="15" cy="11" r="1.5" fill="currentColor" />
      <path d="M9 16c1.5 1 4.5 1 6 0" />
      <path d="M17 7l2-2" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Telegram: TelegramIcon,
  Instagram: InstagramIcon,
  Linkedin: LinkedinIcon,
  Twitter: XIcon,
  Reddit: RedditIcon,
  Github: GithubIcon,
};

export default function ContactSection({ socials = socialsData }: { socials?: SocialLink[] }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    service: "AI Chatbots & Assistants",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CONTACT_CONFIG.EMAIL_ADDRESS);
    soundFx.playChime(600, 0.08);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyHandle = (handle: string) => {
    navigator.clipboard.writeText(handle);
    soundFx.playChime(500, 0.06);
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle(null), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent discard for automated bot submissions

    setIsSubmitting(true);
    setSubmissionError(null);
    trackEvent("contact_form_submit", "contact", { service: formState.service });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          serviceRequested: formState.service,
          message: formState.message,
          contactMethod: `Email (${formState.email})`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        soundFx.playChime(720, 0.12);
        setIsSubmitted(true);
      } else {
        setSubmissionError(
          data.error || "Submission could not be completed. Please try again or reach out directly."
        );
      }
    } catch {
      // Graceful fallback to client mailto link so no inquiry is ever lost
      soundFx.playChime(640, 0.1);
      const subject = encodeURIComponent(`Project Inquiry: ${formState.service} (${formState.name})`);
      const body = encodeURIComponent(
        `Hello Sam,\n\nName: ${formState.name}\nEmail: ${formState.email}\nTopic: ${formState.service}\n\nProject Details:\n${formState.message}\n\nSent from SAM CODES portfolio.`
      );
      window.location.href = `mailto:${CONTACT_CONFIG.EMAIL_ADDRESS}?subject=${subject}&body=${body}`;
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      aria-label="Contact Sam"
      className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]"
    >
      <MotionReveal className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300 mb-4 uppercase tracking-wider">
          <MessageSquare size={13} className="text-cyan-400" />
          Direct Access &amp; Inquiries
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Have Something Worth Building?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          The fastest way to reach me is via our 24/7 Telegram AI Qualifier (@samarth_master_bot) or direct message on Instagram and LinkedIn. For project briefs or scopes, feel free to send an email.
        </p>
      </MotionReveal>

      {/* Primary Social Pathways Grid */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Preferred Channels (Direct Messaging &amp; AI Bot)
          </span>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <Clock size={12} />
            <span>24/7 Live AI Bot on Telegram · Fast DMs on Instagram</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socials
            .filter((s) => s.platform !== "Email")
            .map((item) => {
              const Icon = BRAND_ICONS[item.iconName] || Mail;

              return (
                <SpotlightCard
                  key={item.platform}
                  spotlightColor="rgba(56, 189, 248, 0.12)"
                  className="p-5 flex flex-col justify-between group cursor-default"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      {item.priorityBadge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {item.priorityBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-0.5">
                      {item.platform}
                    </h4>

                    <div className="text-[11px] font-mono text-slate-400 mb-3 truncate">
                      {item.handleOrLabel}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => soundFx.playHover()}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white text-slate-200 hover:text-slate-950 font-mono text-[11px] text-center font-medium transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
                    >
                      <span>{item.directActionLabel}</span>
                      <ExternalLink size={11} />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyHandle(item.handleOrLabel)}
                      title={`Copy ${item.handleOrLabel}`}
                      className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {copiedHandle === item.handleOrLabel ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </SpotlightCard>
              );
            })}
        </div>
      </div>

      {/* Direct Email & Brief Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Direct Email & Direct Builder Transparency (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white">Direct Email</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              If you have a formal project specification or detailed scope, email is great. I read and reply to inquiries personally.
            </p>

            {/* Email Copy Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Mail size={16} className="text-sky-400 shrink-0" />
                <span className="text-xs sm:text-sm font-mono text-white truncate">
                  {CONTACT_CONFIG.EMAIL_ADDRESS}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="px-4 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[44px]"
              >
                {copiedEmail ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/15 text-[11px] font-mono text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Sparkles size={14} />
                <span>DIRECT BUILDER GUARANTEE</span>
              </div>
              <p className="leading-relaxed">
                Based in Karnataka, India (IST UTC+5:30). Open to remote collaboration. You talk directly with the builder writing the code.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Project Inquiry Form (7 cols) */}
        <div className="lg:col-span-7">
          {isSubmitted ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-emerald-500/30 backdrop-blur-sm space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Inquiry Dispatched Successfully</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="text-white font-semibold">{formState.name}</span>. Your project brief has been logged in the Command Center. Sam will review your scope and follow up directly to <span className="text-sky-400 font-mono">{formState.email}</span> within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormState({
                    name: "",
                    email: "",
                    service: "AI Chatbots & Assistants",
                    message: "",
                  });
                }}
                className="mt-4 px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleFormSubmit}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-5"
            >
              <h3 className="text-lg font-bold text-white mb-2">Send a Message</h3>

              {submissionError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Honeypot field for spam bots */}
              <input
                type="text"
                name="user_anti_spam_field"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-mono text-slate-400 mb-1.5">
                    YOUR NAME
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-sky-400 transition-colors min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-mono text-slate-400 mb-1.5">
                    YOUR EMAIL
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-sky-400 transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service" className="block text-xs font-mono text-slate-400 mb-1.5">
                  WHAT DO YOU WANT TO BUILD OR AUTOMATE?
                </label>
                <select
                  id="service"
                  value={formState.service}
                  onChange={(e) => setFormState({ ...formState, service: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#090d1a] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-sky-400 transition-colors cursor-pointer min-h-[44px]"
                >
                  <option value="AI Chatbots & Assistants">AI Chatbot or Customer Assistant</option>
                  <option value="Workflow & Business Automation">Workflow &amp; Business Process Automation</option>
                  <option value="Websites & Web Applications">Website or Modern Web Application</option>
                  <option value="Rapid Prototypes & MVPs">Rapid Working Prototype / MVP</option>
                  <option value="General Collaboration">General / Academic Inquiry</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-mono text-slate-400 mb-1.5">
                  BRIEF DETAILS
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="Describe what needs to work, what you're trying to solve, or what you want to build..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 cursor-pointer min-h-[48px] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Dispatching Brief...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send Message to Sam</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
