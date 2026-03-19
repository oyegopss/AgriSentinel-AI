/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Judge-friendly “Final Demo Screen” that stitches profile + map + weather + risk + mandi + decision
 */

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
  CloudRain,
  Sparkles,
  Bot,
  Loader2,
  MapPin,
} from "lucide-react";
import WeatherCard from "@/app/components/WeatherCard";
import AlertBanner from "@/app/components/AlertBanner";
import { getProfile, getFarm, getRiskPrediction } from "@/lib/api";
import {
  decideAction,
  smartDecisionEngine,
  type DecisionOutput,
  type RiskSignal,
  type DiseaseSignal,
  type YieldSignal,
  type SmartDecisionOutput,
} from "@/lib/decisionEngine";
import { fetchMandiPrices } from "@/lib/mandiApi";

type MandiRow = { crop: string; market: string; price: string; distance: string; isBest: boolean };

type StoredContext = {
  disease?: DiseaseSignal | null;
  yield_data?: YieldSignal | null;
};

function loadStoredContext(): StoredContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("agrisentinel_context");
    if (!raw) return null;
    return JSON.parse(raw) as StoredContext;
  } catch {
    return null;
  }
}

function riskColor(level: string | null | undefined) {
  const l = (level ?? "").toLowerCase();
  if (l.includes("high"))
    return {
      bar: "bg-rose-500",
      glow: "shadow-[0_0_40px_rgba(244,63,94,0.22)]",
      badge: "bg-rose-500/15 text-rose-200 border-rose-500/30",
    };
  if (l.includes("medium"))
    return {
      bar: "bg-amber-400",
      glow: "shadow-[0_0_40px_rgba(251,191,36,0.18)]",
      badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    };
  return {
    bar: "bg-emerald-400",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.16)]",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  };
}

function fmtPct(v: number | null | undefined) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

function parseINRPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtINRCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  // Indian-ish compact formatting without Intl complexities for demo.
  if (n >= 1_00_00_000) return `₹${Math.round(n / 1_00_00_000)} Cr`;
  if (n >= 1_00_000) return `₹${Math.round(n / 1_00_000)} L`;
  if (n >= 1_000) return `₹${Math.round(n / 1_000)}k`;
  return `₹${Math.round(n)}`;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [farm, setFarm] = useState<Record<string, unknown> | null>(null);
  const [riskResponse, setRiskResponse] = useState<{
    weather: { temperature: number | null; humidity: number | null; rainfall: number | null };
    risk: { risk_level: string; probability: number; reason: string };
  } | null>(null);
  const [mandiRows, setMandiRows] = useState<MandiRow[]>([]);
  const [decision, setDecision] = useState<DecisionOutput | null>(null);
  const [finalDecision, setFinalDecision] = useState<SmartDecisionOutput | null>(null);
  const [disease, setDisease] = useState<DiseaseSignal | null>(null);
  const [yieldData, setYieldData] = useState<YieldSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = loadStoredContext();
      setDisease(stored?.disease ?? null);
      setYieldData(stored?.yield_data ?? null);

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
        const out = decideAction(disease, riskSignal, mandiSignal, yieldData);
        setDecision(out);
        setFinalDecision(
          smartDecisionEngine({
            disease_result: disease,
            risk_data: riskSignal,
            mandi_prices: mandiSignal,
            yield_data: yieldData,
          }),
        );
      } else {
        setRiskResponse(null);
        setDecision(null);
        setFinalDecision(
          smartDecisionEngine({
            disease_result: disease,
            risk_data: null,
            mandi_prices: null,
            yield_data: yieldData,
          }),
        );
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
  const diseaseSevere =
    (disease?.severity ?? "").toLowerCase().includes("severe") ||
    (disease?.severity ?? "").toLowerCase().includes("high") ||
    (typeof disease?.confidence === "number" && disease.confidence >= 0.8);
  const showAlert = riskLevel === "High" || diseaseSevere;
  const riskUI = riskColor(riskLevel);

  const baseYield = yieldData?.baseYield ?? null;
  const adjustedYield = yieldData?.adjustedYield ?? null;
  const lossPct =
    baseYield != null && adjustedYield != null && baseYield > 0
      ? Math.max(0, Math.round((1 - adjustedYield / baseYield) * 100))
      : null;

  const farmAreaFromMap =
    typeof (farm as { area_acres?: unknown } | null)?.area_acres === "number"
      ? ((farm as { area_acres?: number } | null)?.area_acres ?? null)
      : null;
  const farmAreaFromProfile =
    typeof (profile as { farm_area_acres?: unknown } | null)?.farm_area_acres === "number"
      ? ((profile as { farm_area_acres?: number } | null)?.farm_area_acres ?? null)
      : null;
  const farmAreaAcres =
    (farmAreaFromMap != null && farmAreaFromMap > 0 ? farmAreaFromMap : null) ??
    (farmAreaFromProfile != null && farmAreaFromProfile > 0 ? farmAreaFromProfile : null);

  const bestMandiPrice = parseINRPrice(mandiRows[0]?.price);

  const hectares = farmAreaAcres != null ? farmAreaAcres * 0.404686 : null;
  const baseProductionTons =
    hectares != null && baseYield != null ? hectares * baseYield : null;
  const potentialLossINR =
    bestMandiPrice != null &&
    baseProductionTons != null &&
    lossPct != null &&
    lossPct > 0
      ? // tons → quintal (×10), value at best mandi price per quintal
        Math.round(((baseProductionTons * (lossPct / 100)) * 10 * bestMandiPrice) / 100) * 100
      : null;

  const finalActionText =
    finalDecision?.decision === "Treat Immediately"
      ? "Treat Crop Immediately"
      : finalDecision?.decision ?? "—";

  const whyLine = (() => {
    const parts: string[] = [];
    const humidity = riskResponse?.weather?.humidity;
    const diseaseName = disease?.name;
    if (typeof humidity === "number") parts.push(`High humidity (${Math.round(humidity)}%)`);
    if (diseaseName) parts.push(`detected ${diseaseName}`);
    if (riskLevel) parts.push(`risk is ${riskLevel}`);
    if (lossPct != null) parts.push(`may reduce yield by ${lossPct}%`);
    if (parts.length === 0) return "Add profile + run analysis to generate the final recommendation.";
    // Keep it short (1–2 lines)
    return parts.slice(0, 4).join(" + ");
  })();

  const expectedBenefit =
    potentialLossINR != null
      ? `Act now to save ${fmtINRCompact(potentialLossINR)} potential loss`
      : bestMandiPrice != null
        ? `Protect quality and capture ~₹${Math.round(bestMandiPrice)}/q mandi price`
        : "Protect yield and reduce downside risk in the next 3–7 days.";

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      {/* premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_10%,rgba(0,195,255,0.18),transparent_60%),radial-gradient(900px_600px_at_80%_0%,rgba(0,255,156,0.14),transparent_55%),radial-gradient(900px_600px_at_60%_90%,rgba(244,63,94,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,15,31,0.65),rgba(10,15,31,0.92))]" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-300">
            <Sparkles className="h-4 w-4 text-[#00FF9C]" />
            FINAL DEMO SCREEN • Real-time Farm Intelligence
          </p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AgriSentinel <span className="text-gradient">Decision Cockpit</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Crop health • Risk • Weather • Yield • Mandi • One final action
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

        {!loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8 space-y-4">
            <AlertBanner show={showAlert} />
          </motion.div>
        )}

        {/* 6) FINAL AI DECISION (hero) */}
        {!loading && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-[#00FF9C]/35 bg-white/5 p-6 shadow-[0_0_60px_rgba(0,255,156,0.12)] backdrop-blur-xl sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#00FF9C]/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#00C3FF]/10 blur-3xl" />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    6) FINAL AI DECISION
                  </p>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00FF9C]/20"
                      animate={{
                        boxShadow: [
                          "0 0 22px rgba(0, 255, 156, 0.20)",
                          "0 0 44px rgba(0, 255, 156, 0.35)",
                          "0 0 22px rgba(0, 255, 156, 0.20)",
                        ],
                      }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Bot className="h-6 w-6 text-[#00FF9C]" />
                    </motion.div>
                    <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                      {finalDecision?.decision ?? "—"}
                    </h2>
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-200/90 sm:text-base">
                    {finalDecision?.reason ??
                      "Set your location in Profile and run Risk/Disease/Yield once to populate the demo pipeline."}
                  </p>
                  {finalDecision?.expected_profit_impact && (
                    <p className="mt-3 text-sm text-[#00FF9C]/90">{finalDecision.expected_profit_impact}</p>
                  )}
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Risk</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${riskUI.badge}`}>
                        {riskLevel ?? "—"}
                      </span>
                      <span className="font-display text-sm font-bold text-white">{fmtPct(riskProbability)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Best mandi</p>
                    <p className="mt-2 font-display text-lg font-bold text-white">{mandiRows[0]?.price ?? "—"}</p>
                    <p className="mt-1 text-xs text-gray-400">{mandiRows[0]?.market ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Yield loss</p>
                    <p className="mt-2 font-display text-lg font-bold text-white">{lossPct == null ? "—" : `${lossPct}%`}</p>
                    <p className="mt-1 text-xs text-gray-400">estimated vs baseline</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Final AI Insight card (judge-friendly) */}
        {!loading && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="mb-10"
          >
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-[#00FF9C]/35 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
              animate={{
                boxShadow: [
                  "0 0 28px rgba(0,255,156,0.10)",
                  "0 0 52px rgba(0,255,156,0.18)",
                  "0 0 28px rgba(0,255,156,0.10)",
                ],
                borderColor: [
                  "rgba(0,255,156,0.35)",
                  "rgba(0,195,255,0.35)",
                  "rgba(0,255,156,0.35)",
                ],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#00FF9C]/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#00C3FF]/10 blur-3xl" />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 font-display text-sm font-semibold text-white/90">
                    🚀 AI Final Recommendation
                  </p>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {finalActionText}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm text-gray-200/90 sm:text-base">
                    {whyLine}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#00FF9C]/90">
                    {expectedBenefit}
                  </p>
                </div>

                <div className="grid gap-2 sm:w-[320px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Inputs used</p>
                    <p className="mt-2 text-sm text-gray-200">
                      {disease?.name ? `Disease: ${disease.name}` : "Disease: —"} •{" "}
                      {riskLevel ? `Risk: ${riskLevel}` : "Risk: —"} •{" "}
                      {bestMandiPrice != null ? `Mandi: ₹${Math.round(bestMandiPrice)}/q` : "Mandi: —"} •{" "}
                      {baseYield != null ? `Yield: ${baseYield} t/ha` : "Yield: —"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {farmAreaAcres != null ? `Farm: ${farmAreaAcres.toFixed(2)} acres` : "Farm: —"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* sections grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* 1) Crop Health */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card neon-border rounded-2xl p-6 lg:col-span-4">
            <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
              <Leaf className="h-5 w-5 text-[#00FF9C]" />
              1) Crop Health
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B6B]/20">
                  <AlertCircle className="h-5 w-5 text-[#FF6B6B]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Disease</p>
                  <p className="font-display font-semibold text-white">{disease?.name ?? "—"}</p>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-sm text-gray-400">Confidence</span>
                <span className="font-display font-bold text-[#00FF9C]">
                  {disease ? `${Math.round(disease.confidence * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-sm text-gray-400">Severity</span>
                <span className="text-sm text-gray-200">{disease?.severity ?? "—"}</span>
              </div>
            </div>
            <Link href="/disease-detection" className="mt-4 inline-block text-sm font-medium text-[#00FF9C] hover:underline">
              Run new detection →
            </Link>
          </motion.section>

          {/* 2) Risk Meter + 3) Weather */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card neon-border rounded-2xl p-6 lg:col-span-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-3 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <BarChart3 className="h-5 w-5 text-[#00C3FF]" />
                  2) Risk Meter
                </h2>
                <p className="mb-4 text-sm text-gray-400">Weather-based probability</p>
                <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${riskUI.glow}`}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-white">{riskLevel ?? "—"}</span>
                    <span className="font-display font-bold text-white">{fmtPct(riskProbability)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full ${riskUI.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, riskProbability * 100))}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-400">{riskResponse?.risk?.reason ?? "Set location in Profile to fetch risk."}</p>
                </div>
              </div>

              <div>
                <h2 className="mb-3 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <CloudRain className="h-5 w-5 text-[#1BFF00]" />
                  3) Weather Card
                </h2>
                <WeatherCard weather={riskResponse?.weather ?? null} />
              </div>
            </div>
          </motion.section>

          {/* 4) Yield Prediction */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card neon-border rounded-2xl p-6 lg:col-span-7">
            <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-[#00FF9C]" />
              4) Yield Prediction
            </h2>
            <p className="mb-5 text-sm text-gray-400">Baseline vs adjusted yield</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Base</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-white">{baseYield ?? "—"}</p>
                <p className="mt-1 text-xs text-gray-400">tons/ha</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Adjusted</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-white">{adjustedYield ?? "—"}</p>
                <p className="mt-1 text-xs text-gray-400">tons/ha</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Loss</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-white">{lossPct == null ? "—" : `${lossPct}%`}</p>
                <p className="mt-1 text-xs text-gray-400">vs baseline</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Crop performance</span>
                <span className="text-white">{lossPct == null ? "—" : `${Math.max(0, 100 - lossPct)}%`}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-[#00C3FF] via-[#00FF9C] to-[#1BFF00]"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      lossPct == null ? "35%" : `${Math.min(100, Math.max(0, 100 - lossPct))}%`,
                  }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.section>

          {/* 5) Mandi Intelligence */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="glass-card neon-border overflow-hidden rounded-2xl lg:col-span-5">
            <div className="border-b border-white/10 bg-white/5 px-6 py-4">
              <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
                <Store className="h-5 w-5 text-[#00FF9C]" />
                5) Mandi Intelligence
              </h2>
              <p className="mt-1 text-sm text-gray-400">Best market + price snapshot</p>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Best market</p>
                    <p className="mt-2 font-display text-xl font-bold text-white">{mandiRows[0]?.market ?? "—"}</p>
                    <p className="mt-1 text-xs text-gray-400">{mandiRows[0]?.crop ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Price</p>
                    <p className="mt-2 font-display text-2xl font-extrabold text-[#00FF9C]">{mandiRows[0]?.price ?? "—"}</p>
                    <p className="mt-1 text-xs text-gray-400">per quintal</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(mandiRows.length > 0 ? mandiRows.slice(0, 3) : []).map((row, idx) => (
                  <div key={row.market + String(idx)} className={`flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 ${row.isBest ? "bg-[#00FF9C]/10" : "bg-white/5"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-200">{row.market}</p>
                      <p className="text-xs text-gray-400">{row.distance}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-display text-sm font-semibold ${row.isBest ? "text-[#00FF9C]" : "text-gray-200"}`}>{row.price}</span>
                      {row.isBest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF9C]/20 px-2 py-1 text-[11px] font-semibold text-[#00FF9C]">
                          <Award className="h-3.5 w-3.5" />
                          Best
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/mandi-intelligence" className="mt-5 block text-center text-sm font-medium text-[#00FF9C] hover:underline">
                View full mandi analysis →
              </Link>
            </div>
          </motion.section>
        </div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/profile" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]">
            <MapPin className="h-4 w-4" /> Profile
          </Link>
          <Link href="/farm-map" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]">
            Farm Map
          </Link>
          <Link href="/disease-detection" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]">
            Disease Detection
          </Link>
          <Link href="/yield-prediction" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]">
            Yield Prediction
          </Link>
          <Link href="/mandi-intelligence" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:text-[#00FF9C]">
            Mandi Intelligence
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
