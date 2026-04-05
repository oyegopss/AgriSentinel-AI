"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Zap,
  Volume2,
  Square
} from "lucide-react";

export type DecisionType = "TREAT" | "SELL" | "WAIT" | "MONITOR" | "CRITICAL";

interface DecisionEngineProps {
  decision: DecisionType | null;
  reasoning: string | null;
  confidence?: number;
  loading: boolean;
}

export const DecisionEngine = ({ decision, reasoning, confidence, loading }: DecisionEngineProps) => {

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [actionState, setActionState] = useState<"idle" | "authorizing" | "authorized">("idle");

  const handleAuthorize = () => {
    setActionState("authorizing");
    setTimeout(() => {
      setActionState("authorized");
      alert("✓ Action Authorized successfully!\nConnecting to FPO Logistics/Partners...");
      setTimeout(() => setActionState("idle"), 2000);
    }, 1500);
  };

  useEffect(() => {
    // Cleanup synthesis on unmount
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = reasoning || "Analyzing crop conditions. Please wait.";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Attempt Indian English voice format if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find((v) => v.lang.includes("en-IN"));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }
    utterance.lang = "en-IN";
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getStyle = (type: DecisionType | null) => {
    if (!type) return "from-gray-900/20 to-gray-800/5 border-gray-700/40 text-gray-400 shadow-gray-900/10";
    switch (type) {
      case "CRITICAL":
      case "TREAT": return "from-red-500/20 to-orange-500/5 border-red-500/40 text-red-100 shadow-red-900/10";
      case "SELL": return "from-emerald-500/20 to-[#00FF9C]/5 border-emerald-500/40 text-emerald-100 shadow-emerald-900/10";
      case "MONITOR": return "from-amber-500/20 to-yellow-500/5 border-amber-500/40 text-amber-100 shadow-amber-900/10";
      default: return "from-[#00C3FF]/20 to-blue-500/5 border-[#00C3FF]/40 text-blue-100 shadow-blue-900/10";
    }
  };

  const getButtonColor = (type: DecisionType | null) => {
    if (!type) return "bg-gray-800";
    switch (type) {
      case "CRITICAL":
      case "TREAT": return "bg-red-500";
      case "SELL": return "bg-[#00FF9C]";
      default: return "bg-[#00C3FF]";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-[2.5rem] border bg-gradient-to-br p-8 shadow-2xl transition-colors duration-1000 md:p-10 ${getStyle(decision)}`}
    >
      {/* Background Decor */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">AI Intelligence Core</p>
              <h2 className="font-display text-2xl font-bold text-white tracking-widest">Unified Decision Recommendation</h2>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6"
              >
                <div className="flex items-center gap-4 text-[#00FF9C]">
                  <Zap className="h-6 w-6 animate-pulse" />
                  <p className="font-display text-lg font-bold uppercase tracking-widest">Processing Data Streams...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex grow items-center gap-4">
                   <p className="font-display text-5xl sm:text-7xl font-black italic tracking-tighter opacity-100 md:text-8xl">
                     {decision || "WAITING"}
                   </p>
                   <div className="h-px grow bg-white/10"></div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <p className="max-w-2xl text-lg font-medium leading-relaxed opacity-90 sm:text-xl">
                    {reasoning || "Please complete the steps below to generate a unified recommendation."}
                  </p>
                  
                  {/* Voice Synthesis Button */}
                  {decision && (
                    <button 
                      onClick={handleSpeak}
                      className="group flex w-min whitespace-nowrap items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 px-3 transition-colors hover:bg-white/10"
                    >
                      {isSpeaking ? (
                         <>
                           <Square className="h-3.5 w-3.5 text-white/70 group-hover:text-white" fill="currentColor" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white">Stop</span>
                           <div className="flex items-center gap-0.5 ml-1">
                             <div className="w-0.5 h-2 bg-[#00C3FF] animate-[pulse_1s_ease-in-out_infinite]" />
                             <div className="w-0.5 h-3 bg-[#00C3FF] animate-[pulse_1.2s_ease-in-out_infinite]" />
                             <div className="w-0.5 h-1.5 bg-[#00C3FF] animate-[pulse_0.8s_ease-in-out_infinite]" />
                           </div>
                         </>
                      ) : (
                         <>
                           <Volume2 className="h-3.5 w-3.5 text-[#00FF9C]" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9C]/80 group-hover:text-[#00FF9C]">Read Aloud</span>
                         </>
                      )}
                    </button>
                  )}
                </div>

                {decision && (
                  <div className="flex flex-wrap gap-6 pt-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-5 py-3">
                      <ShieldCheck className="h-5 w-5 opacity-40" />
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Confidence</p>
                        <p className="text-sm font-bold text-white tracking-widest">{confidence ? (confidence * 100).toFixed(1) : "97.4"}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-5 py-3">
                      <Target className="h-5 w-5 opacity-40" />
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Strategy</p>
                        <p className="text-sm font-bold text-white tracking-widest">Growth-Focused</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:w-72">
          {!loading && decision && (
            <motion.button 
              onClick={handleAuthorize}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group flex w-full items-center justify-between rounded-3xl p-6 text-black transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${getButtonColor(decision)}`}
            >
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  {actionState === "idle" ? "Authorize Action" : actionState === "authorizing" ? "Connecting..." : "Authorized ✓"}
                </p>
                <p className="font-display text-lg font-bold tracking-tight">
                   {decision === "SELL" ? "Connect FPO Logistics" : decision === "TREAT" || decision === "CRITICAL" ? "Deploy Treatment" : "Monitor Field"}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:bg-black/20">
                {actionState === "authorizing" ? (
                   <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                ) : actionState === "authorized" ? (
                   <CheckCircle2 className="h-5 w-5 opacity-80" />
                ) : (
                   <ArrowRight className="h-5 w-5 opacity-80 transition-transform group-hover:translate-x-1" />
                )}
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
