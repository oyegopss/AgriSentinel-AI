"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplet, Activity, FlaskConical, TestTube2 } from "lucide-react";

export const SoilHealthCard = () => {
  const [analyzing, setAnalyzing] = useState(true);
  const [liveN, setLiveN] = useState(42);
  const [liveP, setLiveP] = useState(12);
  const [liveK, setLiveK] = useState(85);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (analyzing) return;
    const interval = setInterval(() => {
       setLiveN(prev => Math.max(30, Math.min(60, prev + (Math.floor(Math.random() * 5) - 2))));
       setLiveP(prev => Math.max(5, Math.min(25, prev + (Math.floor(Math.random() * 3) - 1))));
       setLiveK(prev => Math.max(70, Math.min(95, prev + (Math.floor(Math.random() * 5) - 2))));
    }, 4500);
    return () => clearInterval(interval);
  }, [analyzing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Soil Health AI
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
          <div className={`h-1 w-1 rounded-full ${analyzing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
            {analyzing ? "Analyzing" : "Optimal"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* N, P, K blocks */}
        {[
          { label: "Nitrogen (N)", val: `${liveN} (Med)`, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Phosphorus (P)", val: `${liveP} (Low)`, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-500/30", pulse: true },
          { label: "Potassium (K)", val: `${liveK} (High)`, color: "text-[#00FF9C]", bg: "bg-[#00FF9C]/10" }
        ].map((item, i) => (
          <div key={item.label} className={`rounded-xl border border-white/[0.04] ${item.bg} ${item.border || ""} p-3 flex flex-col gap-1 relative overflow-hidden transition-colors duration-500`}>
            {item.pulse && <div className="absolute inset-0 bg-red-400/5 animate-pulse" />}
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 z-10">{item.label}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${item.color} z-10 opacity-100 transition-all duration-500`}>
              {analyzing ? "---" : item.val}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-white/[0.04] pt-4 flex gap-3 items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
           <TestTube2 className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">AI Recommendation</span>
            {analyzing ? (
              <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
            ) : (
               <span className="text-[11px] font-bold text-gray-300 leading-tight">
                 Apply <span className="text-orange-400">DAP Fertilizer (+3kg/acre)</span> to correct Phosphorus deficit.
               </span>
            )}
        </div>
      </div>
    </motion.div>
  );
};
