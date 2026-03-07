"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Store, TrendingUp, Award, BarChart3, Loader2, AlertTriangle, Database } from "lucide-react";
import { fetchMandiPrices } from "@/lib/mandiApi";

const CROP_OPTIONS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane"] as const;

type MandiRow = {
  id: string;
  crop: string;
  mandiName: string;
  pricePerQuintal: number;
  district: string;
};

function getRecommendation(crop: string, rows: MandiRow[], bestMarket: MandiRow | null): string {
  if (!bestMarket || rows.length === 0) {
    return `No live mandi data available for ${crop} right now.`;
  }
  const nearestMarket = rows[rows.length - 1];
  if (!nearestMarket || bestMarket.id === nearestMarket.id) {
    return `Based on current government mandi prices, ${bestMarket.mandiName} offers competitive rates for ${crop}.`;
  }
  const diff = Math.max(0, bestMarket.pricePerQuintal - nearestMarket.pricePerQuintal);
  return `Based on current government mandi prices, selling at ${bestMarket.mandiName} may increase your profit by ₹${diff} per quintal compared to ${nearestMarket.mandiName}.`;
}

export default function MandiIntelligencePage() {
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<MandiRow[]>([]);

  const rows: MandiRow[] = markets;
  const bestMarket = rows.length
    ? rows.reduce((best, current) =>
        current.pricePerQuintal > best.pricePerQuintal ? current : best
      )
    : null;
  const recommendation = getRecommendation(crop, rows, bestMarket);
  const maxPrice = rows.length ? Math.max(...rows.map((r) => r.pricePerQuintal)) : 1;

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setHasAnalyzed(false);
    setMarkets([]);
    try {
      const data = await fetchMandiPrices(crop, "Uttar Pradesh");
      const mapped: MandiRow[] = data
        .map((record: Record<string, string>, idx: number) => ({
          id: `${record.market ?? "market"}-${idx}`,
          crop: record.commodity ?? crop,
          mandiName: record.market ?? "Unknown Market",
          pricePerQuintal: Number(record.modal_price ?? 0),
          district: record.district ?? "Unknown District",
        }))
        .filter((row) => Number.isFinite(row.pricePerQuintal) && row.pricePerQuintal > 0)
        .sort((a, b) => b.pricePerQuintal - a.pricePerQuintal)
        .slice(0, 10);
      setMarkets(mapped);
      setHasAnalyzed(true);
    } catch (err) {
      console.error("Failed to fetch government mandi data:", err);
      setMarkets([]);
      setError("Unable to fetch mandi data at the moment. Please try again.");
      setHasAnalyzed(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display flex items-center gap-2 text-sm font-semibold text-[#00C3FF] transition-colors hover:text-[#00FF9C]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <span className="font-display text-lg font-bold text-white">
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Smart <span className="text-gradient">Mandi Intelligence</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Find the most profitable market to sell your crops using live government data.
          </p>
        </motion.div>

        {/* Crop Selection */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card neon-border mb-8 rounded-2xl p-6"
        >
          <h2 className="mb-4 font-display text-lg font-semibold text-white">
            Crop Selection
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-400">
                Select Crop
              </label>
              <select
                value={crop}
                onChange={(e) => {
                  setCrop(e.target.value);
                  setHasAnalyzed(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#00FF9C]/50 disabled:opacity-60"
              >
                {CROP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0A0F1F]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <motion.button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="btn-glow-primary flex items-center justify-center gap-2 rounded-xl bg-[#00FF9C] px-8 py-3 font-display font-semibold text-[#0A0F1F] transition-all disabled:opacity-60 disabled:shadow-none hover:bg-[#00e08a]"
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Fetching…
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Analyze Market Prices
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card neon-border flex flex-col items-center justify-center rounded-2xl p-10 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="mb-5"
              >
                <Database className="h-12 w-12 text-[#00FF9C]" />
              </motion.div>
              <p className="text-lg font-semibold text-white">
                Fetching latest mandi prices…
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Connecting to Government Open Data API (data.gov.in)
              </p>
              <div className="mt-5 h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#00FF9C] to-[#00C3FF]"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "70%", "90%", "95%"] }}
                  transition={{ duration: 3, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Placeholder — no results yet */}
          {!hasAnalyzed && !isLoading && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card neon-border flex min-h-[200px] flex-col items-center justify-center rounded-2xl p-8 text-center"
            >
              <Store className="mb-3 h-14 w-14 text-white/20" />
              <p className="text-gray-500">
                Select a crop and click &quot;Analyze Market Prices&quot; to see mandi comparison.
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {hasAnalyzed && !isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center"
            >
              <AlertTriangle className="mb-3 h-10 w-10 text-rose-400" />
              <p className="text-lg font-semibold text-rose-300">{error}</p>
              <p className="mt-2 text-sm text-gray-400">Check your internet connection or try a different crop.</p>
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-4 rounded-xl border border-rose-400/40 bg-rose-400/10 px-6 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/20"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Results */}
          {hasAnalyzed && !isLoading && !error && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-card rounded-xl border border-white/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Markets Found</p>
                  <p className="mt-1 text-2xl font-bold text-white">{rows.length}</p>
                </div>
                <div className="glass-card rounded-xl border border-white/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Best Price</p>
                  <p className="mt-1 text-2xl font-bold text-[#00FF9C]">
                    {bestMarket ? `₹${bestMarket.pricePerQuintal.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="glass-card rounded-xl border border-white/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Best Market</p>
                  <p className="mt-1 truncate text-lg font-semibold text-white">
                    {bestMarket?.mandiName ?? "—"}
                  </p>
                </div>
              </div>

              {/* Mandi Price Table */}
              <div className="glass-card neon-border overflow-hidden rounded-2xl">
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
                    <BarChart3 className="h-5 w-5 text-[#00FF9C]" />
                    Mandi Price Table
                    <span className="ml-auto rounded-full bg-[#00FF9C]/10 px-2.5 py-0.5 text-xs font-medium text-[#00FF9C]">
                      Live Data
                    </span>
                  </h2>
                </div>
                {rows.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">
                    No markets found for {crop} in Uttar Pradesh. Try a different crop.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                          <th className="px-6 py-4 font-display font-semibold">Crop</th>
                          <th className="px-6 py-4 font-display font-semibold">Mandi Name</th>
                          <th className="px-6 py-4 font-display font-semibold">Price (₹/q)</th>
                          <th className="px-6 py-4 font-display font-semibold">District</th>
                          <th className="px-6 py-4 font-display font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const isBestMarket = bestMarket !== null && row.id === bestMarket.id;
                          return (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className={`border-b border-white/5 transition-colors last:border-0 ${
                                isBestMarket
                                  ? "bg-[#00FF9C]/10 border-l-4 border-l-[#00FF9C]"
                                  : "hover:bg-white/5"
                              }`}
                            >
                              <td className="px-6 py-4 font-medium text-white">{row.crop}</td>
                              <td className="px-6 py-4 text-gray-300">{row.mandiName}</td>
                              <td className="px-6 py-4">
                                <span className={isBestMarket ? "font-display font-semibold text-[#00FF9C]" : "text-gray-300"}>
                                  ₹{row.pricePerQuintal.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-400">{row.district}</td>
                              <td className="px-6 py-4">
                                {isBestMarket ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF9C]/20 px-3 py-1 text-xs font-semibold text-[#00FF9C]">
                                    <Award className="h-3.5 w-3.5" />
                                    Best Market
                                  </span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI Recommendation Card */}
              <div className="rounded-2xl border-2 border-[#00FF9C]/50 bg-[#00FF9C]/5 p-6 shadow-[0_0_30px_rgba(0,255,156,0.15)]">
                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[#00FF9C]">
                  AI Recommendation
                </p>
                <p className="leading-relaxed text-gray-200">{recommendation}</p>
              </div>

              {/* Price Comparison Chart */}
              {rows.length > 0 && (
                <div className="glass-card neon-border rounded-2xl p-6">
                  <h2 className="mb-6 font-display text-lg font-semibold text-white">
                    Price Comparison
                  </h2>
                  <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-2">
                    {rows.map((row, i) => (
                      <div key={row.id} className="flex flex-1 flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(row.pricePerQuintal / maxPrice) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full max-w-[80px] min-h-[24px] rounded-t-lg bg-gradient-to-t from-[#00FF9C] to-[#00C3FF]"
                          style={{ maxHeight: "140px" }}
                        />
                        <span className="text-center text-xs font-medium text-gray-400">₹{row.pricePerQuintal}</span>
                        <span className="text-center text-xs text-gray-500">{row.mandiName.replace(/ Mandi/i, "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data source badge */}
              <p className="text-center text-xs text-gray-600">
                Data source: Government of India — data.gov.in Open Data API
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
