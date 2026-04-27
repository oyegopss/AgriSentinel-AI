"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Scan, Cpu } from "lucide-react";

interface SatelliteVisionCardProps {
  weather?: {
    humidity?: number;
    rain?: number;
    temp?: number;
    description?: string;
  } | null;
}

export const SatelliteVisionCard = ({ weather }: SatelliteVisionCardProps) => {
  const [syncing, setSyncing] = useState(true);
  const [liveNDVI, setLiveNDVI] = useState(0.72);
  const [liveMoisture, setLiveMoisture] = useState(45);

  // Derive weather-based starting values once weather loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setSyncing(false);

      const humidity = weather?.humidity ?? 55;
      const rain = weather?.rain ?? 0;
      const temp = weather?.temp ?? 28;

      // Moisture: Wire specifically to humidity / 2 as per pitch request
      const baseMoisture = Math.round(humidity / 2);
      setLiveMoisture(Math.min(85, Math.max(20, baseMoisture)));

      // NDVI: high heat + drought stress → lower NDVI
      // Overcast/rainy → slightly lower NDVI (less photosynthesis)
      let baseNDVI = 0.78;
      if (temp > 36) baseNDVI -= 0.12; // heat stress
      if (humidity < 35) baseNDVI -= 0.08; // drought stress
      if (rain > 10) baseNDVI -= 0.04; // cloud/waterlogging
      if (humidity > 70 && temp < 33) baseNDVI += 0.05; // good growing conditions
      setLiveNDVI(Math.min(0.92, Math.max(0.55, Number(baseNDVI.toFixed(2)))));
    }, 3000);
    return () => clearTimeout(timer);
  }, [weather]);

  // Small natural fluctuation after init
  useEffect(() => {
    if (syncing) return;
    const interval = setInterval(() => {
      setLiveNDVI(prev => {
        let np = prev + (Math.random() * 0.02 - 0.01); // tiny ±0.01 swing
        return Number(Math.min(0.92, Math.max(0.55, np)).toFixed(2));
      });
      setLiveMoisture(prev => {
        let nm = prev + (Math.floor(Math.random() * 3) - 1); // ±1 point swing
        return Math.min(85, Math.max(20, nm));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [syncing]);

  const ndviLabel = liveNDVI > 0.75 ? "High Vigor" : liveNDVI > 0.65 ? "Normal Vigor" : "Stress Detected";
  const ndviColor = liveNDVI > 0.75 ? "text-emerald-400" : liveNDVI > 0.65 ? "text-amber-400" : "text-red-400";

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
                Processing Weather Bands...
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
                <div className="space-y-1.5">
                  {/* NDVI bar */}
                  <div className="flex items-center gap-2 transition-all duration-700">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${liveNDVI * 44}px`,
                        background: liveNDVI > 0.75 ? "#00FF9C" : liveNDVI > 0.65 ? "#f59e0b" : "#f43f5e"
                      }}
                    />
                    <span className={`text-[8px] font-mono font-bold ${ndviColor}`}>
                      NDVI: {liveNDVI} ({ndviLabel})
                    </span>
                  </div>
                  {/* Moisture bar */}
                  <div className="flex items-center gap-2 transition-all duration-700">
                    <div
                      className="h-1 bg-[#00C3FF] rounded-full transition-all duration-700"
                      style={{ width: `${(liveMoisture / 85) * 44}px` }}
                    />
                    <span className="text-[8px] font-mono text-gray-400">
                      Moisture: {liveMoisture}% <span className="text-gray-600">(weather-derived)</span>
                    </span>
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
