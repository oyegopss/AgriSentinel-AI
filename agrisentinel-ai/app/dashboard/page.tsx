"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  MapPin,
} from "lucide-react";
import WeatherCard from "@/app/components/WeatherCard";
import AlertBanner from "@/app/components/AlertBanner";
import { getProfile, getFarm, getRiskPrediction } from "@/lib/api";
import { decideAction, type DecisionOutput, type RiskSignal } from "@/lib/decisionEngine";
import { fetchMandiPrices } from "@/lib/mandiApi";

type MandiRow = { crop: string; market: string; price: string; distance: string; isBest: boolean };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [farm, setFarm] = useState<Record<string, unknown> | null>(null);
  const [riskResponse, setRiskResponse] = useState<{
    weather: { temperature: number | null; humidity: number | null; rainfall: number | null };
    risk: { risk_level: string; probability: number; reason: string };
  } | null>(null);
  const [mandiRows, setMandiRows] = useState<MandiRow[]>([]);
  const [decision, setDecision] = useState<DecisionOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, farmData] = await Promise.all([
        getProfile().catch(() => ({})),
        getFarm().catch(() => ({})),
      ]);
      setProfile(profileData && Object.keys(profileData).length > 0 ? profileData : null);
      setFarm(farmData && Object.keys(farmData).length > 0 ? farmData : null);

      const loc = (profileData as { location?: { latitude?: number; longitude?: number } })?.location;
      const lat = loc?.latitude;
      const lon = loc?.longitude;
      const crop =
        (profileData as { crop_types?: string[] })?.crop_types?.[0] || "Wheat";

      if (typeof lat === "number" && typeof lon === "number") {
        const risk = await getRiskPrediction({ crop_type: crop, latitude: lat, longitude: lon });
        setRiskResponse(risk);
        const riskSignal: RiskSignal = {
          level: risk.risk.risk_level,
          probability: risk.risk.probability,
        };
        let mandiSignal: { bestPrice: number | null; breakevenPrice: number | null } = {
          bestPrice: null,
          breakevenPrice: 2000,
        };
        try {
          const mandiData = await fetchMandiPrices(crop);
          if (Array.isArray(mandiData) && mandiData.length > 0) {
            const prices = mandiData
              .map((r: Record<string, unknown>) => {
                const raw = r.modal_price ?? r.max_price ?? r.price;
                const p = typeof raw === "string" ? parseFloat(raw) : Number(raw);
                return { ...r, numPrice: p };
              })
              .filter((r: { numPrice: number }) => !Number.isNaN(r.numPrice) && r.numPrice > 0)
              .sort((a: { numPrice: number }, b: { numPrice: number }) => b.numPrice - a.numPrice);
            const best = prices[0];
            if (best?.numPrice) {
              mandiSignal = { bestPrice: best.numPrice, breakevenPrice: 2000 };
              setMandiRows(
                prices.slice(0, 5).map((r: Record<string, unknown>, i: number) => ({
                  crop,
                  market: String(r.market ?? r.mandi ?? "Mandi"),
                  price: `₹${(r as { numPrice: number }).numPrice}`,
                  distance: String(r.distance ?? "—"),
                  isBest: i === 0,
                }))
              );
            }
          }
        } catch {
          setMandiRows([]);
        }
        const out = decideAction(
          null,
          riskSignal,
          mandiSignal,
          null
        );
        setDecision(out);
      } else {
        setRiskResponse(null);
        setDecision(null);
        setMandiRows([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const riskLevel = riskResponse?.risk?.risk_level ?? null;
  const riskProbability = riskResponse?.risk?.probability ?? 0;
  const showAlert = riskLevel === "High";
  const yourYield = 4.8;
  const regionalAvg = 4.1;
  const maxYield = Math.max(yourYield, regionalAvg);

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

        {loading && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#00FF9C]" />
            <span className="text-gray-400">Loading profile, weather & risk…</span>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300">
            {error}
          </div>
        )}

        {/* Weather + Alert + Risk */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 space-y-4"
          >
            <AlertBanner show={showAlert} />
            <WeatherCard weather={riskResponse?.weather ?? null} />
            {riskResponse?.risk && (
              <div className="glass-card neon-border rounded-2xl border p-6">
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Disease risk (weather-based)
                </h3>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white">{riskLevel}</span>
                  <span className="text-[#00FF9C]">{Math.round(riskProbability * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[#00FF9C]"
                    initial={{ width: 0 }}
                    animate={{ width: `${riskProbability * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">{riskResponse.risk.reason}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 1 — Overview Cards (live) */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Link
              href="/profile"
              className="glass-card neon-border rounded-2xl border p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,156,0.2)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00FF9C]/20">
                  <Leaf className="h-6 w-6 text-[#00FF9C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Profile</p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {profile ? (profile.name as string) || "Saved" : "Set up profile"}
                  </p>
                </div>
              </div>
            </Link>
            <div className="glass-card neon-border rounded-2xl border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00C3FF]/20">
                  <BarChart3 className="h-6 w-6 text-[#00C3FF]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Risk level</p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {riskLevel ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card neon-border rounded-2xl border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1BFF00]/20">
                  <Store className="h-6 w-6 text-[#1BFF00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Best mandi</p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {mandiRows[0]?.price ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card neon-border rounded-2xl border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00FF9C]/20">
                  <TrendingUp className="h-6 w-6 text-[#00FF9C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Decision</p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {decision?.final_decision ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                  {decision?.reason ?? "Set your profile and location to get a personalised recommendation."}
                </p>
                {decision?.profit_impact && (
                  <p className="mt-3 text-sm text-[#00FF9C]/90">{decision.profit_impact}</p>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  From profile, weather, risk & mandi data
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
                {(mandiRows.length > 0 ? mandiRows : [
                  { crop: "—", market: "—", price: "—", distance: "—", isBest: false },
                ]).map((row, idx) => (
                  <tr
                    key={row.market + String(idx)}
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

        {/* SECTION 5 — AI Decision (when we have decision) */}
        {decision && (
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
                Recommended action: {decision.final_decision}
              </h2>
            </div>
            <p className="text-gray-200 leading-relaxed">{decision.reason}</p>
            <p className="mt-3 text-[#00FF9C]/90">{decision.profit_impact}</p>
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]"
          >
            <MapPin className="h-4 w-4" /> Profile
          </Link>
          <Link
            href="/farm-map"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]"
          >
            Farm Map
          </Link>
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
