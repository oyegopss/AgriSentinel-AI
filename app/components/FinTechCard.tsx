"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Landmark, ShieldCheck, CheckCircle2 } from "lucide-react";

export const FinTechCard = () => {
  const [computing, setComputing] = useState(true);
  const [liveLoan, setLiveLoan] = useState(50000);
  const [livePremium, setLivePremium] = useState(850);

  useEffect(() => {
    const timer = setTimeout(() => {
      setComputing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (computing) return;
    const interval = setInterval(() => {
       setLiveLoan(prev => prev + (Math.floor(Math.random() * 3) - 1) * 500);
       setLivePremium(prev => prev + (Math.floor(Math.random() * 3) - 1) * 5);
    }, 4000);
    return () => clearInterval(interval);
  }, [computing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Credit & Insurance Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5">
           <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
             FinTech Partner
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Loan Section */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 flex items-center justify-between animate-[pulse_4s_ease-in-out_infinite]">
           <div className="flex flex-col gap-1">
             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Pre-approved Agri Loan</span>
             {computing ? (
                <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
             ) : (
                <span className="text-xl font-black text-white tabular-nums tracking-tight">₹{liveLoan.toLocaleString()}</span>
             )}
             <span className="text-[8px] text-gray-600 mt-1 uppercase tracking-widest">Based on 3-yr yield history</span>
           </div>
           <div className="h-10 w-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center">
             <CheckCircle2 className="h-5 w-5 text-purple-400 opacity-100" />
           </div>
        </div>

        {/* Insurance Section */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 flex items-center justify-between animate-[pulse_5s_ease-in-out_infinite]">
           <div className="flex flex-col gap-1">
             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Crop Insurance Status</span>
             {computing ? (
                <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
             ) : (
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-emerald-400 tracking-tight">Active</span>
                  <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest px-1.5 py-0.5 border border-emerald-500/20 rounded">Low Risk</span>
                </div>
             )}
             <span className="text-[8px] text-gray-600 mt-1 uppercase tracking-widest">Premium: ₹{livePremium}/season</span>
           </div>
           <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center">
             <ShieldCheck className="h-5 w-5 text-emerald-400 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style={{ animationDelay: "3s" }} />
           </div>
        </div>
      </div>
    </motion.div>
  );
};
