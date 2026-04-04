"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ShieldCheck, Banknote, ArrowRight } from "lucide-react";

interface EconomicImpactProps {
  diseaseResult: any;
  weather: any;
  farmArea?: number; // in acres
}

export const EconomicImpact = ({ diseaseResult, weather, farmArea = 2.5 }: EconomicImpactProps) => {
  // Heuristic baseline: 2000 kg per acre for demo (e.g. Wheat/Rice)
  const baselineYieldPerAcre = 2000; 
  const totalWeight = farmArea * baselineYieldPerAcre;
  const avgPricePerKg = 22.50; // ₹/kg
  
  const potentialRevenue = totalWeight * avgPricePerKg;
  
  // Yield loss based on disease severity
  let yieldLossPct = 0;
  if (diseaseResult?.severity === "Low") yieldLossPct = 5;
  else if (diseaseResult?.severity === "Medium" || diseaseResult?.severity === "Moderate Risk") yieldLossPct = 15;
  else if (diseaseResult?.severity === "High" || diseaseResult?.severity === "High Risk") yieldLossPct = 35;
  
  const economicRisk = potentialRevenue * (yieldLossPct / 100);
  const protectedValue = economicRisk * 0.85; // Assuming 85% efficacy of treatment

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Potential Revenue */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card rounded-3xl p-6 border border-white/5 bg-white/[0.02] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Market Value</span>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Potential Revenue</h4>
          <p className="text-2xl font-display font-black text-white">₹{potentialRevenue.toLocaleString()}</p>
          <p className="text-[9px] text-gray-600 mt-2 font-medium">EST. FOR {farmArea} ACRES @ ₹{avgPricePerKg}/KG</p>
        </div>
      </motion.div>

      {/* Economic Risk */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card rounded-3xl p-6 border border-red-500/10 bg-red-500/[0.02] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-[10px] font-bold text-red-400/60 uppercase tracking-widest">Risk Analysis</span>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Economic Risk</h4>
          <p className="text-2xl font-display font-black text-red-400">₹{economicRisk.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold uppercase tracking-widest">-{yieldLossPct}% Yield</span>
            <span className="text-[9px] text-gray-600 font-medium">DUE TO {diseaseResult?.disease?.split(' (')[0] || 'ENVIRONMENT'}</span>
          </div>
        </div>
      </motion.div>

      {/* Protected Value */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card rounded-3xl p-6 border border-[#00FF9C]/20 bg-[#00FF9C]/[0.02] flex flex-col justify-between overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 bg-[#00FF9C]/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF9C]/10">
            <ShieldCheck className="h-5 w-5 text-[#00FF9C]" />
          </div>
          <span className="text-[10px] font-bold text-[#00FF9C]/60 uppercase tracking-widest">Profit Guard</span>
        </div>
        <div className="relative">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Protected Value</h4>
          <p className="text-2xl font-display font-black text-[#00FF9C]">₹{protectedValue.toLocaleString()}</p>
          <p className="text-[9px] text-[#00FF9C]/60 mt-2 font-medium flex items-center gap-1 uppercase tracking-widest">
            AI Recommendation applied <ArrowRight className="h-3 w-3" />
          </p>
        </div>
      </motion.div>
    </div>
  );
};
