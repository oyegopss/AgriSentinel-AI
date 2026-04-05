"use client";

import React from "react";
import { motion } from "framer-motion";
import { History, TrendingUp, CalendarDays, Sprout } from "lucide-react";

const HISTORY_DATA = [
  {
    season: "Kharif 2025",
    crop: "Paddy",
    yield: "18 Qtl/Acre",
    profit: "₹32,500",
    status: "Success",
  },
  {
    season: "Rabi 2024",
    crop: "Wheat",
    yield: "15 Qtl/Acre",
    profit: "₹28,000",
    status: "Moderate Disease",
  },
  {
    season: "Kharif 2024",
    crop: "Paddy",
    yield: "12 Qtl/Acre",
    profit: "₹18,000",
    status: "Failed Treatment",
  },
];

export const FarmHistory = () => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <History className="h-4 w-4 text-blue-400" />
        </div>
        <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
          Intelligence Module 04: AI Farm History (Data Power)
        </h3>
      </div>

      <div className="space-y-3">
        {HISTORY_DATA.map((item, i) => (
          <motion.div
            key={item.season}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.05]">
                 <CalendarDays className="h-4 w-4 text-gray-500" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-gray-200">{item.season}</h4>
                 <div className="flex items-center gap-2 mt-1">
                   <Sprout className="h-3 w-3 text-emerald-500/50" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.crop}</span>
                   <span className="text-gray-700 mx-1">•</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.status}</span>
                 </div>
               </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-mono text-gray-400">{item.yield}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400 tabular-nums">{item.profit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
