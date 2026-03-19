"use client";

/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Final demo dashboard screen (crop health + risk + weather + yield + mandi + decision).
 */

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  BarChart3,
  Store,
  TrendingUp,
  AlertCircle,
  Award,
  Sparkles,
  Bot,
} from "lucide-react";

const AI_INSIGHTS = [
  "Based on crop health analysis and mandi prices, selling wheat at Lucknow mandi within the next 7 days may increase profit by ₹150 per quintal.",
  "Early signs of Leaf Spot disease detected. Applying copper fungicide within the next 3 days may prevent yield loss.",
  "Current rainfall and soil conditions suggest a higher-than-average yield for maize this season.",
];

const OVERVIEW_CARDS = [
  { label: "Crop Health", value: "Leaf Spot Detected", icon: Leaf, color: "#00FF9C" },
  { label: "Predicted Yield", value: "4.8 tons per hectare", icon: BarChart3, color: "#00C3FF" },
  { label: "Best Market Price", value: "₹2250 / quintal", icon: Store, color: "#1BFF00" },
  { label: "Profit Opportunity", value: "+₹150 per quintal", icon: TrendingUp, color: "#00FF9C" },
];

const MANDI_ROWS = [
  { crop: "Wheat", market: "Lucknow Mandi", price: "₹2250", distance: "45 km", isBest: true },
  { crop: "Wheat", market: "Kanpur Mandi", price: "₹2100", distance: "10 km", isBest: false },
  { crop: "Wheat", market: "Etawah Mandi", price: "₹2050", distance: "30 km", isBest: false },
];

export default function DashboardPage() {
  const yourYield = 4.8;
  const regionalAvg = 4.1;
  const maxYield = Math.max(yourYield, regionalAvg);
  const aiInsight = useMemo(
    () => AI_INSIGHTS[Math.floor(Math.random() * AI_INSIGHTS.length)],
    []
  );

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Farmer <span className="text-gradient">Intelligence Dashboard</span>
          </h1>
          <p className="mt-2 text-gray-400">
            AI-powered insights for smarter farming decisions.
          </p>
        </motion.div>

        {/* SECTION 1 — Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {OVERVIEW_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card neon-border rounded-2xl border p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,156,0.2)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <card.icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {card.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Farming Insight — recommendation panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="glass-card rounded-2xl border border-[#00FF9C]/30 p-6 shadow-[0_0_40px_rgba(0,255,156,0.08)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,255,156,0.12)] hover:border-[#00FF9C]/50">
            <div className="flex items-start gap-4">
              <motion.div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00FF9C]/20"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0, 255, 156, 0.25)",
                    "0 0 35px rgba(0, 255, 156, 0.4)",
                    "0 0 20px rgba(0, 255, 156, 0.25)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="h-6 w-6 text-[#00FF9C]" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-2 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-[#00FF9C]" />
                  AI Farming Insight
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {aiInsight}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  Generated from crop health, mandi data & weather
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* SECTION 2 — Crop Health Status */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card neon-border rounded-2xl p-6"
          >
            <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
              <Leaf className="h-5 w-5 text-[#00FF9C]" />
              Crop Health Status
            </h2>
            <p className="mb-2 text-sm text-gray-400">Last analyzed crop image result</p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B6B]/20">
                  <AlertCircle className="h-5 w-5 text-[#FF6B6B]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Disease Detected</p>
                  <p className="font-display font-semibold text-white">Leaf Spot</p>
                </div>
              </div>
              <div className="mb-4 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-sm text-gray-400">Confidence</span>
                <span className="font-display font-bold text-[#00FF9C]">92%</span>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">
                  Suggested Treatment
                </p>
                <p className="text-sm leading-relaxed text-gray-300">
                  Apply copper fungicide and remove infected leaves.
                </p>
              </div>
            </div>
            <Link
              href="/disease-detection"
              className="mt-4 inline-block text-sm font-medium text-[#00FF9C] hover:underline"
            >
              Run new detection →
            </Link>
          </motion.div>

          {/* SECTION 3 — Yield Prediction Chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card neon-border rounded-2xl p-6"
          >
            <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
              <BarChart3 className="h-5 w-5 text-[#00C3FF]" />
              Yield Prediction Chart
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              Predicted yield compared to regional average
            </p>
            <div className="flex items-end justify-around gap-6 border-b border-white/10 pb-2">
              <div className="flex flex-1 flex-col items-center gap-3">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(yourYield / maxYield) * 100}%`,
                  }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-[100px] min-h-[24px] rounded-t-lg bg-linear-to-t from-[#00FF9C] to-[#00C3FF]"
                  style={{ maxHeight: "180px" }}
                />
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-[#00FF9C]">
                    {yourYield}
                  </p>
                  <p className="text-xs text-gray-400">Your farm (tons/hectare)</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center gap-3">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(regionalAvg / maxYield) * 100}%`,
                  }}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-[100px] min-h-[24px] rounded-t-lg bg-white/20"
                  style={{ maxHeight: "180px" }}
                />
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-gray-300">
                    {regionalAvg}
                  </p>
                  <p className="text-xs text-gray-400">Regional average (tons/hectare)</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 4 — Mandi Price Insights */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 glass-card neon-border overflow-hidden rounded-2xl"
        >
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <Store className="h-5 w-5 text-[#00FF9C]" />
              Mandi Price Insights
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-display font-semibold">Crop</th>
                  <th className="px-6 py-4 font-display font-semibold">Market</th>
                  <th className="px-6 py-4 font-display font-semibold">Price</th>
                  <th className="px-6 py-4 font-display font-semibold">Distance</th>
                  <th className="px-6 py-4 font-display font-semibold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {MANDI_ROWS.map((row) => (
                  <tr
                    key={row.market}
                    className={`border-b border-white/5 last:border-0 ${
                      row.isBest ? "bg-[#00FF9C]/10" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-white">{row.crop}</td>
                    <td className="px-6 py-4 text-gray-300">{row.market}</td>
                    <td
                      className={`px-6 py-4 font-display font-semibold ${
                        row.isBest ? "text-[#00FF9C]" : "text-gray-300"
                      }`}
                    >
                      {row.price}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{row.distance}</td>
                    <td className="px-6 py-4">
                      {row.isBest ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF9C]/20 px-3 py-1 text-xs font-semibold text-[#00FF9C]">
                          <Award className="h-3.5 w-3.5" />
                          Best Market
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            href="/mandi-intelligence"
            className="block border-t border-white/10 px-6 py-3 text-center text-sm font-medium text-[#00FF9C] hover:bg-white/5"
          >
            View full mandi analysis →
          </Link>
        </motion.div>

        {/* SECTION 5 — AI Farming Insights */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 rounded-2xl border-2 border-[#00FF9C]/50 bg-[#00FF9C]/5 p-6 shadow-[0_0_30px_rgba(0,255,156,0.15)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF9C]/20">
              <Sparkles className="h-5 w-5 text-[#00FF9C]" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white">
              AI Farming Insights
            </h2>
          </div>
          <p className="text-gray-200 leading-relaxed">
            Based on crop health and market prices, harvesting within the next 10
            days and selling at Lucknow mandi may maximize profit.
          </p>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/disease-detection"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]"
          >
            Disease Detection
          </Link>
          <Link
            href="/yield-prediction"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]"
          >
            Yield Prediction
          </Link>
          <Link
            href="/mandi-intelligence"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]"
          >
            Mandi Intelligence
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
