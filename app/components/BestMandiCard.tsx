"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, MapPin, TrendingUp, Trophy } from "lucide-react";

interface MandiEntry {
  market: string;
  price: number;
  netProfit: number;
}

interface BestMandiCardProps {
  bestMandi: MandiEntry | null;
  allMandis?: MandiEntry[];
  loading?: boolean;
}

function fmt(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export const BestMandiCard = ({
  bestMandi,
  allMandis = [],
  loading = false,
}: BestMandiCardProps) => {
  // Sort all mandis by net profit descending for the table
  const sortedMandis = [...allMandis].sort((a, b) => b.netProfit - a.netProfit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Store className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Best Mandi by Net Profit
        </span>
      </div>

      {/* Winner card */}
      {loading ? (
        <div className="h-24 w-full rounded-xl bg-white/[0.03] animate-pulse" />
      ) : bestMandi ? (
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 overflow-hidden">
          {/* Trophy badge top-right */}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
            <Trophy className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
              Best Pick
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white tracking-tight truncate">
                {bestMandi.market}
              </p>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                Market Price: {fmt(bestMandi.price)} / qtl
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-white/[0.04] pt-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">
                Estimated Net Profit
              </p>
              <p className="text-xl font-black text-emerald-400 tabular-nums">
                {fmt(bestMandi.netProfit)}
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                After Treatment
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-col gap-2">
            <button className="relative w-full overflow-hidden rounded-lg bg-emerald-500/10 px-4 py-2.5 transition-all hover:bg-emerald-500/20 group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] items-center font-bold text-emerald-400 uppercase tracking-widest">
                    Direct Sell via FPO Buyer
                  </span>
                </div>
                <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest border border-emerald-500/20 rounded px-1.5 py-0.5">
                  0% Middleman
                </span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-[11px] text-gray-600 font-bold uppercase tracking-widest">
            Awaiting disease analysis…
          </p>
        </div>
      )}

      {/* Comparison table for all mandis */}
      {!loading && sortedMandis.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 px-1">
            All Markets (ranked by net profit)
          </p>
          {sortedMandis.map((m, i) => {
            const isBest = m.market === bestMandi?.market;
            return (
              <div
                key={m.market}
                className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  isBest
                    ? "border border-white/[0.06] bg-white/[0.03]"
                    : "bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-gray-700 w-3 tabular-nums">
                    {i + 1}
                  </span>
                  <span
                    className={`text-[11px] font-bold truncate ${
                      isBest ? "text-gray-200" : "text-gray-500"
                    }`}
                  >
                    {m.market}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] text-gray-600 tabular-nums font-mono">
                    {fmt(m.price)}/qtl
                  </span>
                  <span
                    className={`text-[10px] font-black tabular-nums ${
                      isBest ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    {fmt(m.netProfit)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
