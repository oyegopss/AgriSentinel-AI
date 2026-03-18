"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Loader2, Send, Sparkles } from "lucide-react";
import { getAIAgentResponse } from "@/lib/api";

type StoredContext = {
  disease?: string | null;
  risk?: unknown;
  yield_data?: unknown;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ urgency?: string; estimated_cost?: string; timeline?: string } | null>(null);

  const quickPrompts = [
    { label: "What should I spray?", text: "What should I spray right now? Give product options, dose, and safety." },
    { label: "How to reduce risk?", text: "How can I reduce disease risk in the next 7 days? Give a practical plan." },
    { label: "Expected loss?", text: "What yield loss should I expect, and what actions reduce it fastest?" },
  ] as const;

  const loadContext = (): StoredContext => {
    try {
      const raw = localStorage.getItem("agrisentinel_context");
      if (!raw) return {};
      const data = JSON.parse(raw) as StoredContext;
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  };

  const handleSend = async (overrideText?: string) => {
    const finalText = (overrideText ?? input).trim();
    if (!finalText || isLoading) return;
    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setMeta(null);
    try {
      const ctx = loadContext();
      const res = await getAIAgentResponse({
        query: finalText,
        disease: ctx.disease ?? undefined,
        risk: ctx.risk,
        yield_data: ctx.yield_data,
      });
      setAnswer(res.advice);
      setMeta({ urgency: res.urgency, estimated_cost: res.estimated_cost, timeline: res.timeline });
    } catch (err) {
      console.error("AI agent call failed", err);
      setError("AI assistant is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => handleSend();

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#00FF9C] text-[#0A0F1F] shadow-lg shadow-[#00FF9C]/40 transition-transform hover:scale-105"
        aria-label="Open AI Farmer Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-40 w-80 max-w-[90vw] rounded-2xl border border-white/15 bg-[#050814]/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#00FF9C]">
                  AI Farmer Assistant
                </p>
                <p className="text-[11px] text-gray-500">Ask about disease, yield, or mandi strategy.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-gray-300">
              {error && <p className="text-rose-400">{error}</p>}
              {!error && !answer && !isLoading && (
                <p className="text-gray-500">Example: "My wheat leaves have rust spots, what should I do this week?"</p>
              )}
              {!error && answer && (
                <>
                  {meta?.urgency && (
                    <p className="mb-1 text-[11px] font-semibold text-amber-400">Urgency: {meta.urgency}</p>
                  )}
                  {meta?.timeline && (
                    <p className="mb-1 text-[11px] font-semibold text-[#00FF9C]/80">Timeline: {meta.timeline}</p>
                  )}
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{answer}</p>
                  {meta?.estimated_cost && (
                    <p className="mt-2 text-[11px] text-gray-400">Estimated cost: {meta.estimated_cost}</p>
                  )}
                </>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00FF9C]" />
                  <span>Thinking like an agronomist…</span>
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setInput(p.text);
                    handleSend(p.text);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#00FF9C]" />
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question…"
                className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-gray-500 focus:border-[#00FF9C]/50"
              />
              <button
                type="button"
                onClick={handleSendClick}
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00FF9C] text-[#0A0F1F] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
