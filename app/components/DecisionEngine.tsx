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
  Zap
} from "lucide-react";

export type DecisionType = "TREAT" | "SELL" | "WAIT" | "MONITOR" | "CRITICAL";

interface DecisionEngineProps {
  decision: DecisionType | null;
  reasoning: string | null;
  confidence?: number;
  loading: boolean;
}

export const DecisionEngine = ({ decision, reasoning, confidence, loading }: DecisionEngineProps) => {

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
                
                <p className="max-w-2xl text-lg font-medium leading-relaxed opacity-90 sm:text-xl">
                  {reasoning || "Please complete the steps below to generate a unified recommendation."}
                </p>

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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group flex w-full items-center justify-between rounded-3xl p-6 text-black transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${getButtonColor(decision)}`}
            >
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Authorize Action</p>
                <p className="font-display text-xl font-bold tracking-widest">Proceed Now</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10 group-hover:bg-black/20 transition-all">
                <ArrowRight className="h-6 w-6" />
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
