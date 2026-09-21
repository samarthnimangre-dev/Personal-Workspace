"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  queryDeterministicAssistant,
  assistantKnowledgeBase,
  KnowledgeQnA,
} from "@/data/assistantKnowledge";
import { soundFx } from "@/utils/sound";
import { Sparkles, Send, X, Bot, User, RotateCcw } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

const DEFAULT_CHIPS = [
  "What does Sam build?",
  "How can Sam help?",
  "What is Sam currently exploring?",
  "Show me Sam's work.",
  "How can I work with Sam?",
];

export default function AskSamAssistant({
  knowledge = assistantKnowledgeBase,
}: {
  knowledge?: KnowledgeQnA[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am Sam's portfolio assistant. Ask me anything about what Sam builds, his approach to automation and web systems, or how to get in touch.",
      timestamp: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-ask-sam", handleOpen);
    return () => window.removeEventListener("open-ask-sam", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    soundFx.playHover();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const answer = queryDeterministicAssistant(query, knowledge);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: answer,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      soundFx.playChime(560, 0.08);
    }, 450);
  };

  const handleResetChat = () => {
    soundFx.playHover();
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "Chat refreshed. What would you like to know about Sam?",
        timestamp: "Just now",
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => {
          soundFx.playChime(600, 0.08);
          setIsOpen(!isOpen);
        }}
        aria-label="Toggle Ask Sam interactive assistant"
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-mono text-xs shadow-2xl shadow-cyan-500/30 flex items-center gap-2 border border-cyan-300/30 transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
      >
        <Sparkles size={16} className="text-cyan-200 animate-spin-slow" />
        <span className="font-bold">Ask Sam</span>
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
      </button>

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask Sam Assistant"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full sm:max-w-lg h-[80vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl bg-[#060914]/95 border border-white/[0.1] flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Ask Sam</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Zero Hallucination
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Grounded Knowledge Agent
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.sender === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-tr-none font-sans text-xs sm:text-sm shadow-sm"
                        : "bg-[#060914]/80 border border-white/[0.08] text-slate-200 rounded-tl-none font-sans text-xs sm:text-sm"
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.sender === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-center text-slate-500 font-mono text-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Bot size={14} />
                  </div>
                  <span className="animate-pulse text-cyan-300">Retrieving grounded facts...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 border-t border-white/[0.04] bg-[#04060c] overflow-x-auto flex gap-1.5 no-scrollbar">
              {DEFAULT_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-[#060914]/70 hover:bg-[#0a0f20] border border-white/[0.06] hover:border-cyan-400/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#04060c] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about turnaround, scoping, or how Sam builds..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors min-h-[44px]"
              />

              <button
                type="submit"
                disabled={!inputValue.trim()}
                aria-label="Send question"
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-md shadow-cyan-500/20"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
