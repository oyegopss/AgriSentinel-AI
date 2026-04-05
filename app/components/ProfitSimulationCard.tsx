"use client";

import React from "react";
import { motion } from "framer-motion";
import { Banknote, ArrowDown, ArrowUp, Minus } from "lucide-react";

interface ProfitSimulationCardProps {
  profitIfTreated: number | null;
  profitIfIgnored: number | null;
  loss: number | null; // positive = savings by treating, negative = cost is more than gain
  loading?: boolean;
}

function fmt(n: number) {
  return "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
}

export const ProfitSimulationCard = ({
  profitIfTreated,
  profitIfIgnored,
  loss,
  loading = false,
}: ProfitSimulationCardProps) => {
  const isPositive = (loss ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Profit Simulation
        </span>
      </div>

      {/* Three rows */}
      <div className="flex flex-col gap-3">
        {/* If treated */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                If Treated
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">After treatment cost</p>
            </div>
          </div>
          {loading ? (
            <div className="h-5 w-20 rounded bg-white/5 animate-pulse" />
          ) : (
            <span className="text-base font-black tabular-nums text-emerald-400">
              {profitIfTreated != null ? fmt(profitIfTreated) : "—"}
            </span>
          )}
        </div>

        {/* If ignored */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowDown className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                If Ignored
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Without intervention</p>
            </div>
          </div>
          {loading ? (
            <div className="h-5 w-20 rounded bg-white/5 animate-pulse" />
          ) : (
            <span className="text-base font-black tabular-nums text-red-400">
              {profitIfIgnored != null ? fmt(profitIfIgnored) : "—"}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/[0.04]" />

        {/* Loss / Savings delta (COST OF INACTION) */}
        <div className="flex flex-col mt-2 px-1">
          <div className="flex items-center gap-2 mb-1">
            <Minus className="h-4 w-4 text-amber-500" />
            <span className="text-[12px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
              COST OF INACTION (LOSS IF IGNORED)
            </span>
          </div>
          {loading ? (
            <div className="h-6 w-24 rounded bg-white/5 animate-pulse mt-2" />
          ) : (
            <span
              className={`text-3xl font-black tabular-nums tracking-tighter ${
                isPositive ? "text-emerald-400" : "text-amber-500"
              }`}
            >
              {loss != null
                ? `${isPositive ? "-" : "-"}${fmt(Math.abs(loss))}`
                : "—"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
