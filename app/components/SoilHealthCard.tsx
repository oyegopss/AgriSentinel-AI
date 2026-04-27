"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FlaskConical, TestTube2, Wifi, Radio } from "lucide-react";

const SENSOR_NODES = [
  { id: "AS-N01", name: "Field A" },
  { id: "AS-N02", name: "Field B" },
  { id: "AS-N03", name: "Field C" },
];

export const SoilHealthCard = ({ crop = "Wheat" }: { crop?: string }) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [liveN, setLiveN] = useState(0);
  const [liveP, setLiveP] = useState(0);
  const [liveK, setLiveK] = useState(0);
  const [rec, setRec] = useState("");
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const c = crop.toLowerCase();
    if (c.includes("wheat")) {
      setLiveN(110); setLiveP(35); setLiveK(50);
      setRec("Apply 20kg/acre Urea at tillering stage for optimal protein content.");
    } else if (c.includes("rice") || c.includes("paddy")) {
      setLiveN(95); setLiveP(40); setLiveK(75);
      setRec("Potassium is slightly low. Apply MOP to improve stalk strength.");
    } else if (c.includes("cotton")) {
      setLiveN(85); setLiveP(45); setLiveK(90);
      setRec("Phosphorus is adequate, but monitor Nitrogen during boll formation.");
    } else if (c.includes("mustard")) {
      setLiveN(70); setLiveP(30); setLiveK(40);
      setRec("Apply Sulphur-based fertilizers for higher oil content in seeds.");
    } else {
      setLiveN(60); setLiveP(25); setLiveK(65);
      setRec("Apply NPK 19:19:19 water-soluble fertilizer for balanced growth.");
    }
    const timer = setTimeout(() => setAnalyzing(false), 1500);
    return () => clearTimeout(timer);
  }, [crop]);

  useEffect(() => {
    if (analyzing) return;
    const interval = setInterval(() => {
      setLiveN(prev => prev + (Math.floor(Math.random() * 3) - 1));
      setLiveK(prev => prev + (Math.floor(Math.random() * 3) - 1));
      setActiveNode(prev => (prev + 1) % SENSOR_NODES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [analyzing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-4 h-full"
    >
      {/* Header */}
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
            {analyzing ? "Uplink..." : "Sensor Live"}
          </span>
        </div>
      </div>

      {/* IoT Sensor Node indicators */}
      <div className="flex gap-1.5">
        {SENSOR_NODES.map((node, i) => (
          <div
            key={node.id}
            className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-0.5 transition-all duration-700 ${
              activeNode === i
                ? "border-[#00FF9C]/40 bg-[#00FF9C]/5"
                : "border-white/[0.04] bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-1">
              <Radio className={`h-2 w-2 transition-colors duration-700 ${activeNode === i ? "text-[#00FF9C]" : "text-gray-600"}`} />
              <span className="text-[7px] font-mono font-bold text-gray-500">{node.id}</span>
            </div>
            <span className="text-[8px] font-bold text-gray-400">{node.name}</span>
            {/* Signal bars */}
            <div className="flex items-end gap-0.5 mt-0.5">
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`rounded-[1px] transition-all duration-700 ${activeNode === i ? "bg-[#00FF9C]" : "bg-gray-700"}`}
                  style={{ width: "3px", height: `${bar * 2.5}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NPK Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Nitrogen (N)", val: `${liveN} (Opt)`, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Phosphorus (P)", val: `${liveP} (Low)`, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-500/30", pulse: true },
          { label: "Potassium (K)", val: `${liveK} (Med)`, color: "text-[#00FF9C]", bg: "bg-[#00FF9C]/10" }
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border border-white/[0.04] ${item.bg} ${item.border || ""} p-3 flex flex-col gap-1 relative overflow-hidden transition-colors duration-500`}>
            {item.pulse && <div className="absolute inset-0 bg-red-400/5 animate-pulse" />}
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 z-10">{item.label}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${item.color} z-10 transition-all duration-500`}>
              {analyzing ? "---" : item.val}
            </span>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="mt-auto border-t border-white/[0.04] pt-3 flex gap-3 items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
          <TestTube2 className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">{crop} Recommendation</span>
          {analyzing ? (
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          ) : (
            <span className="text-[11px] font-bold text-gray-300 leading-tight">{rec}</span>
          )}
        </div>
      </div>

      {/* IoT uplink footer */}
      {!analyzing && (
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.03] bg-white/[0.01] px-2.5 py-1.5">
          <Wifi className="h-2.5 w-2.5 text-[#00FF9C]" />
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
            IoT Network Online — 3/3 nodes reporting
          </span>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};
