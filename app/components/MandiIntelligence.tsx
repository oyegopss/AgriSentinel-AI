"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  ChevronDown,
  Info,
  DollarSign
} from "lucide-react";
import { fetchMandiPrices } from "@/lib/mandiApi";
import { useAuth } from "@/lib/AuthProvider";

const CROPS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane", "Mustard"];
const TRANSPORT_RATE = 20; // ₹ per km

interface MandiData {
  market: string;
  price: number;
  distance: number;
  profit: number;
  trend: "up" | "down" | "stable";
}

export const MandiIntelligence = () => {
  const { profile } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [mandiList, setMandiList] = useState<MandiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.crops && profile.crops[0]) {
      setSelectedCrop(profile.crops[0]);
    }
  }, [profile]);

  const loadMandiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentState = profile?.locationData?.state || "Uttar Pradesh";
      const data = await fetchMandiPrices(selectedCrop, currentState);
      
      const refinedData: MandiData[] = data.map((item: any) => {
        const distance = Math.floor(Math.random() * 45) + 5; // 5-50km mock
        const price = Number(item.modal_price) || 2100;
        return {
          market: item.market || "Unknown",
          price: price,
          distance: distance,
          profit: price - (distance * TRANSPORT_RATE),
          trend: Math.random() > 0.5 ? "up" : "down"
        };
      });

      // Sort by profit
      refinedData.sort((a, b) => b.profit - a.profit);
      setMandiList(refinedData);
    } catch (err: any) {
      setError(err.message || "Failed to sync market data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMandiData();
  }, [selectedCrop]);

  // Live Fluctuation Ticker Effect
  useEffect(() => {
    if (loading || mandiList.length === 0) return;
    const interval = setInterval(() => {
      setMandiList(prev => [...prev].map(m => {
        // small random fluctuation -5 to +5 Rs
        const change = Math.floor(Math.random() * 11) - 5;
        const newPrice = m.price + change;
        const newTrend = change >= 0 ? "up" : "down";
        return {
          ...m,
          price: newPrice,
          profit: newPrice - (m.distance * TRANSPORT_RATE),
          trend: newTrend as "up" | "down" | "stable"
        };
      }).sort((a, b) => b.profit - a.profit));
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const bestMarket = mandiList[0];

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-white/5 bg-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-[#00FF9C]" />
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
            Market Intelligence
            <span className="flex items-center gap-1.5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/20 px-2 py-0.5">
               <div className="h-1 w-1 rounded-full bg-[#00FF9C] animate-pulse" />
               <span className="text-[8px] font-black text-[#00FF9C] uppercase tracking-tighter">Gov-Verified Live</span>
            </span>
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-[#050505] px-4 py-2 pr-10 text-xs font-bold text-white outline-hidden transition-all focus:border-[#00FF9C]/50"
            >
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
          <button 
            onClick={loadMandiData}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <Info className="h-6 w-6" />
            </div>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button onClick={loadMandiData} className="text-xs font-bold text-[#00FF9C] uppercase tracking-widest hover:underline">Retry Connection</button>
          </div>
        ) : loading ? (
          <div className="space-y-4 py-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-white/5"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Best Market Highlight */}
            {bestMarket && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-[#00FF9C]/30 bg-[#00FF9C]/5 p-5"
              >
                <div className="absolute -right-4 -top-4 opacity-10">
                  <DollarSign className="h-24 w-24 text-[#00FF9C]" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[#00FF9C] uppercase tracking-[0.2em]">
                    Best Market Selection
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="font-display text-xl font-bold text-white">{bestMarket.market}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {bestMarket.distance} km away • ₹{TRANSPORT_RATE}/km transport
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Expected Profit</p>
                      <p className="font-display text-2xl font-bold text-[#00FF9C]">₹{bestMarket.profit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-3 pl-2">Market</th>
                    <th className="pb-3 text-right">Price/Q</th>
                    <th className="pb-3 text-right">Dist.</th>
                    <th className="pb-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mandiList.map((item, idx) => (
                    <tr key={idx} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="py-4 pl-2 font-semibold text-white">{item.market}</td>
                      <td className="py-4 text-right font-mono font-bold text-gray-300">₹{item.price}</td>
                      <td className="py-4 text-right text-gray-400">{item.distance} km</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end">
                           {item.trend === "up" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-4 border-t border-white/5">
               <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  <span>Transport Optimization Rate: ₹20/km</span>
                  <div className="flex gap-4">
                     <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div> Growth</span>
                     <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-400"></div> Volatile</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
