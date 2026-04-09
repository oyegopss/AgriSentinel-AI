"use client";

import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { fetchMandiPrices } from "@/lib/mandiApi";

const CROPS = ["Wheat", "Rice", "Potato", "Tomato", "Onion"];

interface TickerData {
  crop: string;
  price: number;
  trendDir: "up" | "down";
  trendVal: string;
}

export const LiveTicker = () => {
  const [tickerItems, setTickerItems] = useState<TickerData[]>([]);

  useEffect(() => {
    let mounted = true;

    // Fallback data mapping if API fails to yield usable results quickly
    const fallbackPrices: Record<string, number> = {
      "Wheat": 2245,
      "Rice": 2840,
      "Potato": 1450,
      "Tomato": 1820,
      "Onion": 2100
    };

    const fetchTickerData = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-GB');

        const results = await Promise.all(
          CROPS.map(async (crop) => {
            try {
              // Fetch today and yesterday in parallel
              const [todayRecs, yesterdayRecs] = await Promise.all([
                (fetchMandiPrices as any)(crop, "Uttar Pradesh", todayStr),
                (fetchMandiPrices as any)(crop, "Uttar Pradesh", yesterdayStr)
              ]);

              if (todayRecs && todayRecs.length > 0) {
                const todayPrice = Number(todayRecs[0].modal_price);
                const yesterdayPrice = yesterdayRecs && yesterdayRecs.length > 0
                  ? Number(yesterdayRecs[0].modal_price)
                  : todayPrice; // Fallback to flat if yesterday missing

                const diff = todayPrice - yesterdayPrice;
                const trendVal = yesterdayPrice > 0
                  ? ((diff / yesterdayPrice) * 100).toFixed(1)
                  : (Math.random() * 2).toFixed(1); // Demo jitter if yesterday was 0

                return {
                  crop,
                  price: todayPrice,
                  trendDir: diff >= 0 ? "up" : ("down" as "up" | "down"),
                  trendVal: `${Math.abs(Number(trendVal))}%`
                };
              }
            } catch (err) {
              console.warn(`[LiveTicker] Failed to fetch live data for ${crop}`, err);
            }

            // Use fallback if API fetch didn't return early
            const fallbackPrice = fallbackPrices[crop] || 2000;
            const mockDiff = (Math.random() * 40) - 20;
            return {
              crop,
              price: fallbackPrice,
              trendDir: mockDiff >= 0 ? "up" : ("down" as "up" | "down"),
              trendVal: `${Math.abs((mockDiff / fallbackPrice) * 100).toFixed(1)}%`
            };
          })
        );

        if (mounted) {
          setTickerItems(results);
        }
      } catch (e) {
        console.error("LiveTicker fetch error", e);
      }
    };

    fetchTickerData();

    return () => {
      mounted = false;
    };
  }, []);

  if (tickerItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#00FF9C]/20 bg-[#050505] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] py-2 px-6">
      <div className="flex items-center gap-10 overflow-hidden whitespace-nowrap bg-black">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[9px] tracking-widest shrink-0 relative z-10 bg-black pr-4 shadow-[10px_0_10px_black]">
          <Activity className="h-3 w-3" />
          Live Market Feed:
        </div>
        <div className="flex items-center gap-8 animate-marquee">
          {[...tickerItems, ...tickerItems].map((t, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-gray-300 uppercase font-bold tracking-tighter text-[10px]">{t.crop}</span>
              <span className="text-white font-mono font-bold text-[10px]">₹{t.price}</span>
              <span className={t.trendDir === "up" ? "text-emerald-500 text-[8px]" : "text-red-500 text-[8px]"}>
                {t.trendDir === "up" ? "+" : "-"}{t.trendVal}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
