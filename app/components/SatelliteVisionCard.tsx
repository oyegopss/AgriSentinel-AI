"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Scan, Cpu } from "lucide-react";

export const SatelliteVisionCard = () => {
  const [syncing, setSyncing] = useState(true);
  const [liveNDVI, setLiveNDVI] = useState(0.72);
  const [liveMoisture, setLiveMoisture] = useState(45);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSyncing(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (syncing) return;
    const interval = setInterval(() => {
       setLiveNDVI(prev => {
          let np = prev + (Math.random() * 0.04 - 0.02);
          if (np > 0.9) np = 0.9;
          if (np < 0.6) np = 0.6;
          return Number(np.toFixed(2));
       });
       setLiveMoisture(prev => {
          let nm = prev + (Math.floor(Math.random() * 5) - 2);
          if (nm > 60) nm = 60;
          if (nm < 30) nm = 30;
          return nm;
       });
    }, 3500);
    return () => clearInterval(interval);
  }, [syncing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="h-3.5 w-3.5 text-[#00C3FF]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Satellite & Drone Vision
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
          <div className={`h-1.5 w-1.5 rounded-full ${syncing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
            {syncing ? "Syncing Feed" : "Live"}
          </span>
        </div>
      </div>

      <div className="relative flex-1 rounded-xl border border-white/[0.04] bg-black overflow-hidden min-h-[140px] flex items-center justify-center isolate">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <AnimatePresence mode="wait">
          {syncing ? (
            <motion.div
              key="syncing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 z-10"
            >
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00C3FF]/30 animate-[spin_4s_linear_infinite]" />
                <Satellite className="h-5 w-5 text-[#00C3FF] animate-pulse" />
              </div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00C3FF]">
                Establishing Uplink...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full p-4 flex flex-col justify-between z-10"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase tracking-widest text-gray-500">Scan Resolution</span>
                  <span className="text-[10px] font-mono text-[#00C3FF]">0.3m/pixel</span>
                </div>
                <Scan className="h-4 w-4 text-[#00C3FF]/50" />
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 transition-all duration-500">
                     <div className="h-1 bg-[#00FF9C] rounded-full transition-all duration-500" style={{ width: `${liveNDVI * 40}px` }} />
                     <span className="text-[8px] font-mono text-gray-400">NDVI: {liveNDVI} ({liveNDVI > 0.7 ? "High Vigor" : "Normal Vigor"})</span>
                   </div>
                   <div className="flex items-center gap-2 transition-all duration-500">
                     <div className="h-1 bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${liveMoisture}px` }} />
                     <span className="text-[8px] font-mono text-gray-400">Moisture: {liveMoisture}%</span>
                   </div>
                </div>
                <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-gray-500 border border-white/10 rounded px-1.5 py-0.5 bg-black/50">
                  <Cpu className="h-2.5 w-2.5 text-[#00C3FF]" />
                  AI Processed
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Scanning line animation */}
        {!syncing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00C3FF]/50 to-transparent animate-[scanline_3s_ease-in-out_infinite]" />
        )}
      </div>
    </motion.div>
  );
};
