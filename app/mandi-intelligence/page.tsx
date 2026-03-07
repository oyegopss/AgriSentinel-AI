"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Store, TrendingUp, Award, BarChart3 } from "lucide-react";

const CROP_OPTIONS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane"] as const;

type MandiRow = {
  id: string;
  mandiName: string;
  pricePerQuintal: number;
  distanceKm: number;
  isBest?: boolean;
};

/** Example data per crop – Wheat as in prompt; others for dropdown */
const MANDI_BY_CROP: Record<string, MandiRow[]> = {
  Wheat: [
    { id: "w1", mandiName: "Kanpur Mandi", pricePerQuintal: 2100, distanceKm: 10 },
    { id: "w2", mandiName: "Lucknow Mandi", pricePerQuintal: 2250, distanceKm: 45, isBest: true },
    { id: "w3", mandiName: "Etawah Mandi", pricePerQuintal: 2050, distanceKm: 30 },
  ],
  Rice: [
    { id: "r1", mandiName: "Kanpur Mandi", pricePerQuintal: 1850, distanceKm: 10 },
    { id: "r2", mandiName: "Lucknow Mandi", pricePerQuintal: 1980, distanceKm: 45, isBest: true },
    { id: "r3", mandiName: "Etawah Mandi", pricePerQuintal: 1820, distanceKm: 30 },
  ],
  Maize: [
    { id: "m1", mandiName: "Kanpur Mandi", pricePerQuintal: 1950, distanceKm: 10, isBest: true },
    { id: "m2", mandiName: "Lucknow Mandi", pricePerQuintal: 1920, distanceKm: 45 },
    { id: "m3", mandiName: "Etawah Mandi", pricePerQuintal: 1880, distanceKm: 30 },
  ],
  Cotton: [
    { id: "c1", mandiName: "Kanpur Mandi", pricePerQuintal: 6200, distanceKm: 10 },
    { id: "c2", mandiName: "Lucknow Mandi", pricePerQuintal: 6350, distanceKm: 45, isBest: true },
    { id: "c3", mandiName: "Etawah Mandi", pricePerQuintal: 6100, distanceKm: 30 },
  ],
  Sugarcane: [
    { id: "s1", mandiName: "Kanpur Mandi", pricePerQuintal: 320, distanceKm: 10 },
    { id: "s2", mandiName: "Lucknow Mandi", pricePerQuintal: 335, distanceKm: 45, isBest: true },
    { id: "s3", mandiName: "Etawah Mandi", pricePerQuintal: 310, distanceKm: 30 },
  ],
};

function getRecommendation(crop: string, rows: MandiRow[]): string {
  const best = rows.find((r) => r.isBest);
  const sorted = [...rows].sort((a, b) => a.pricePerQuintal - b.pricePerQuintal);
  const nearest = sorted[0];
  if (!best || !nearest || best.id === nearest.id)
    return `Based on current mandi prices, ${best?.mandiName ?? "the selected mandi"} offers competitive rates for ${crop}.`;
  const diff = best.pricePerQuintal - nearest.pricePerQuintal;
  return `Based on current mandi prices, selling at ${best.mandiName} may increase your profit by approximately ₹${diff} per quintal compared to the nearest market.`;
}

export default function MandiIntelligencePage() {
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const rows: MandiRow[] = MANDI_BY_CROP[crop] ?? MANDI_BY_CROP.Wheat;
  const recommendation = getRecommendation(crop, rows);
  const maxPrice = Math.max(...rows.map((r) => r.pricePerQuintal));

  const handleAnalyze = () => {
    setIsLoading(true);
    setHasAnalyzed(false);
    setTimeout(() => {
      setIsLoading(false);
      setHasAnalyzed(true);
    }, 2000);
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
            Find the most profitable market to sell your crops.
          </p>
        </motion.div>

        {/* SECTION 1 — Crop Selection */}
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
                onChange={(e) => setCrop(e.target.value)}
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
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 rounded-full border-2 border-[#0A0F1F] border-t-transparent"
                  />
                  Analyzing…
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Analyze Market Prices
                </>
              )}
            </motion.button>
          </div>
          {isLoading && (
            <p className="mt-4 text-center text-sm text-[#00FF9C]">
              Analyzing real-time mandi prices…
            </p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!hasAnalyzed && !isLoading ? (
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
          ) : (
            hasAnalyzed &&
            !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {/* SECTION 2 — Mandi Price Table */}
                <div className="glass-card neon-border overflow-hidden rounded-2xl">
                  <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                    <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
                      <BarChart3 className="h-5 w-5 text-[#00FF9C]" />
                      Mandi Price Table
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                          <th className="px-6 py-4 font-display font-semibold">Crop</th>
                          <th className="px-6 py-4 font-display font-semibold">Mandi Name</th>
                          <th className="px-6 py-4 font-display font-semibold">Price (₹ per quintal)</th>
                          <th className="px-6 py-4 font-display font-semibold">Distance (km)</th>
                          <th className="px-6 py-4 font-display font-semibold">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.id}
                            className={`border-b border-white/5 transition-colors last:border-0 ${
                              row.isBest
                                ? "bg-[#00FF9C]/10 border-l-4 border-l-[#00FF9C]"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <td className="px-6 py-4 font-medium text-white">{crop}</td>
                            <td className="px-6 py-4 text-gray-300">{row.mandiName}</td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  row.isBest
                                    ? "font-display font-semibold text-[#00FF9C]"
                                    : "text-gray-300"
                                }
                              >
                                ₹{row.pricePerQuintal.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{row.distanceKm} km</td>
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
                </div>

                {/* SECTION 3 — AI Recommendation Card (glowing green border) */}
                <div className="rounded-2xl border-2 border-[#00FF9C]/50 bg-[#00FF9C]/5 p-6 shadow-[0_0_30px_rgba(0,255,156,0.15)]">
                  <p className="text-sm font-medium uppercase tracking-wider text-[#00FF9C] mb-2">
                    AI Recommendation
                  </p>
                  <p className="text-gray-200 leading-relaxed">
                    {recommendation}
                  </p>
                </div>

                {/* SECTION 4 — Profit Comparison Chart (bar chart) */}
                <div className="glass-card neon-border rounded-2xl p-6">
                  <h2 className="mb-6 font-display text-lg font-semibold text-white">
                    Price comparison
                  </h2>
                  <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-2">
                    {rows.map((row, i) => (
                      <div key={row.id} className="flex flex-1 flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{
                            height: `${(row.pricePerQuintal / maxPrice) * 100}%`,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1 * i,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="w-full max-w-[80px] min-h-[24px] rounded-t-lg bg-linear-to-t from-[#00FF9C] to-[#00C3FF]"
                          style={{ maxHeight: "140px" }}
                        />
                        <span className="text-center text-xs font-medium text-gray-400">
                          ₹{row.pricePerQuintal}
                        </span>
                        <span className="text-center text-xs text-gray-500">
                          {row.mandiName.replace(" Mandi", "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
