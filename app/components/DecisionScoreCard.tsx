"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Shield, Activity } from "lucide-react";

interface DecisionScoreCardProps {
  score: number | null;
  risk: string | null;
  recommendation: string | null;
  loading?: boolean;
}

function RiskIcon({ risk }: { risk: string }) {
  if (risk.toLowerCase().includes("critical"))
    return <ShieldAlert className="h-4 w-4 text-red-400" />;
  if (risk.toLowerCase().includes("high"))
    return <ShieldAlert className="h-4 w-4 text-orange-400" />;
  if (risk.toLowerCase().includes("moderate"))
    return <Shield className="h-4 w-4 text-amber-400" />;
  return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
}

function scoreColor(score: number) {
  if (score >= 75) return "#34d399"; // emerald
  if (score >= 50) return "#fbbf24"; // amber
  if (score >= 30) return "#f97316"; // orange
  return "#f87171"; // red
}

function scoreLabel(score: number) {
  if (score >= 75) return "Low Risk";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "High Risk";
  return "Critical";
}

export const DecisionScoreCard = ({
  score,
  risk,
  recommendation,
  loading = false,
}: DecisionScoreCardProps) => {
  const safeScore = score ?? 0;
  const color = scoreColor(safeScore);
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Decision Score
          </span>
        </div>
        {risk && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">
            <RiskIcon risk={risk} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">
              {risk}
            </span>
          </div>
        )}
      </div>

      {/* Score Ring + number */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            {/* Track */}
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="#ffffff08"
              strokeWidth="6"
            />
            {/* Progress */}
            <motion.circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke={loading ? "#ffffff20" : color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: loading ? circumference : offset }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <span className="text-[10px] text-gray-600 font-bold">—</span>
            ) : (
              <>
                <span
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ color }}
                >
                  {safeScore}
                </span>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                  {scoreLabel(safeScore)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Recommendation text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
            Recommendation
          </p>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-2.5 w-4/5 rounded bg-white/5 animate-pulse" />
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-gray-300 font-medium">
              {recommendation || "Awaiting analysis…"}
            </p>
          )}
        </div>
      </div>

      {/* Score bar */}
      {!loading && (
        <div>
          <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: "0%" }}
              animate={{ width: `${safeScore}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[8px] text-gray-700 font-bold">0</span>
            <span className="text-[8px] text-gray-700 font-bold">100</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
