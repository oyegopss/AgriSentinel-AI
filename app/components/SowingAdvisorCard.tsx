"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Sprout, ChevronRight, Info } from "lucide-react";

const SOWING_CALENDAR: Record<string, { season: string; crops: string[]; tip: string; color: string }> = {
  "January": {
    season: "Rabi",
    crops: ["Wheat", "Mustard", "Potato"],
    tip: "Harvesting peak for early crops; prepare for late winter sowing.",
    color: "#00C3FF"
  },
  "February": {
    season: "Rabi / Zaid",
    crops: ["Sunflower", "Okra", "Cucumber"],
    tip: "Ideal time for summer vegetables as the soil begins to warm.",
    color: "#FFD700"
  },
  "March": {
    season: "Zaid",
    crops: ["Moong", "Bottle Gourd", "Bitter Gourd"],
    tip: "Focus on short-duration crops that thrive in dry heat.",
    color: "#FFA500"
  },
  "April": {
    season: "Zaid / Kharif Prep",
    crops: ["Maize", "Tomato", "Chilies"],
    tip: "Peak summer sowing window. Ensure consistent irrigation.",
    color: "#FF4500"
  },
  "May": {
    season: "Kharif Prep",
    crops: ["Turmeric", "Ginger", "Cotton"],
    tip: "Start preparing nurseries; use the heat for soil solarization.",
    color: "#8B4513"
  },
  "June": {
    season: "Kharif",
    crops: ["Rice (Nursery)", "Sugarcane", "Soyabean"],
    tip: "Monsoon onset is critical. Time your sowing with first rains.",
    color: "#00FF9C"
  },
  "July": {
    season: "Kharif",
    crops: ["Rice (Transplant)", "Maize", "Bajra"],
    tip: "Peak monsoon activity. Focus on drainage and transplanting.",
    color: "#008000"
  },
  "August": {
    season: "Kharif / Rabi Prep",
    crops: ["Potato (Early)", "Cauliflower", "Peas"],
    tip: "Transition month. Avoid low-lying areas due to heavy rains.",
    color: "#ADFF2F"
  },
  "September": {
    season: "Rabi Prep",
    crops: ["Tomato", "Radish", "Carrot"],
    tip: "Start winter vegetable nurseries as humidity begins to drop.",
    color: "#FFDB58"
  },
  "October": {
    season: "Rabi",
    crops: ["Wheat", "Barley", "Mustard"],
    tip: "Main Rabi season kick-off. Soil moisture is optimal.",
    color: "#D2691E"
  },
  "November": {
    season: "Rabi",
    crops: ["Garlic", "Onion", "Strawberry"],
    tip: "Cold weather crops thrive. Monitor for early morning frost.",
    color: "#1E90FF"
  },
  "December": {
    season: "Rabi",
    crops: ["Wheat (Late)", "Cabbage", "Spinach"],
    tip: "Protect sensitive plants from extreme cold and fog.",
    color: "#F0F8FF"
  },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const SowingAdvisorCard = () => {
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];
  const advice = SOWING_CALENDAR[currentMonthName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[2rem] p-6 border border-white/5 bg-white/[0.01] flex flex-col h-full overflow-hidden group hover:border-[#00FF9C]/20 transition-all duration-500"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-medium text-white flex items-center gap-2 tracking-widest text-[9px] uppercase">
          <Calendar className="h-3 w-3 text-[#00FF9C]" />
          Sowing Advisor
        </h3>
        <span className="text-[8px] font-black text-[#00FF9C] bg-[#00FF9C]/10 px-2 py-0.5 rounded-full border border-[#00FF9C]/20 uppercase tracking-tighter">
          {advice.season} Season
        </span>
      </div>

      <div className="mb-6">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Window</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-display font-black text-white tracking-tighter">{currentMonthName}</h4>
        </div>
      </div>

      <div className="space-y-2 mb-6 flex-1">
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-3">Best Crops to Plant Now</p>
        {advice.crops.map((crop, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group/crop hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: advice.color }} />
              <span className="text-xs font-bold text-gray-200">{crop}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group/crop hover:opacity-100 transition-opacity">
              <span className="text-[8px] text-[#00FF9C] font-black uppercase">Favorable</span>
              <ChevronRight className="h-3 w-3 text-[#00FF9C]" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-[#00FF9C]/5 border border-[#00FF9C]/10">
        <div className="flex items-start gap-2">
          <Info className="h-3 w-3 text-[#00FF9C] mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed text-gray-400 italic">
            <span className="text-[#00FF9C] font-bold uppercase text-[9px] not-italic mr-1">Advisor Tip:</span>
            {advice.tip}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
