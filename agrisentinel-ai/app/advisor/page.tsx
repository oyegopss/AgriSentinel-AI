"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Camera,
  Leaf,
  BarChart3,
  Store,
  Sparkles,
  Activity,
  AlertTriangle,
  TrendingUp,
  Target,
  Loader2,
  CheckCircle2,
  ImageIcon,
  ShieldCheck,
  Sprout,
  Award,
} from "lucide-react";
import { runDiseaseInference, healthScoreFromSeverity, type DiseaseResult, type AdvisorSeverity } from "@/lib/advisorInference";
import { predictYield, adjustYieldBySeverity, yieldLossPercent, type YieldParams } from "@/lib/advisorYield";
import { fetchMandiPrices } from "@/lib/mandiApi";
import { getAIAgentResponse, getProfile, getRiskPrediction } from "@/lib/api";
import WeatherCard from "@/app/components/WeatherCard";
import AlertBanner from "@/app/components/AlertBanner";

const CROP_OPTIONS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane"] as const;
const SOIL_OPTIONS = ["Loamy", "Clay", "Sandy", "Black Soil"] as const;
const TRANSPORT_COST_PER_KM = 3;

const DEMO_IMAGES = [
  { label: "Healthy", src: "/demo-leaves/healthy_leaf.svg" },
  { label: "Rust", src: "/demo-leaves/rust_leaf.svg" },
  { label: "Powdery Mildew", src: "/demo-leaves/powdery_leaf.svg" },
  { label: "Leaf Spot", src: "/demo-leaves/leaf_spot.svg" },
];

const ANALYSIS_STEPS = [
  { id: 1, label: "Uploading image…", icon: Upload },
  { id: 2, label: "Analyzing leaf image…", icon: Leaf },
  { id: 3, label: "Running yield model…", icon: BarChart3 },
  { id: 4, label: "Fetching mandi prices…", icon: Store },
  { id: 5, label: "Generating recommendation…", icon: Sparkles },
] as const;

type MarketRow = {
  market: string;
  district: string;
  price: number;
  distanceKm: number;
  profitPerQuintal: number;
};

function getSeverityLabel(s: AdvisorSeverity) {
  const map: Record<AdvisorSeverity, string> = { Healthy: "No Risk", Mild: "Low Risk", Moderate: "Moderate Risk", Severe: "High Risk" };
  return map[s] ?? "Moderate Risk";
}
function getSeverityColor(s: AdvisorSeverity) {
  const map: Record<AdvisorSeverity, string> = { Healthy: "text-[#00FF9C]", Mild: "text-emerald-400", Moderate: "text-amber-400", Severe: "text-rose-400" };
  return map[s] ?? "text-amber-400";
}
function getSeverityBg(s: AdvisorSeverity) {
  const map: Record<AdvisorSeverity, string> = { Healthy: "bg-[#00FF9C]/15", Mild: "bg-emerald-400/15", Moderate: "bg-amber-400/15", Severe: "bg-rose-400/15" };
  return map[s] ?? "bg-amber-400/15";
}
function getHealthColor(score: number) {
  if (score >= 90) return "#00FF9C";
  if (score >= 75) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function getTreatment(disease: string): string {
  if (disease === "Healthy Leaf") return "No action needed. Continue regular monitoring.";
  if (disease === "Rust Disease") return "Apply fungicide (tebuconazole/azoxystrobin) within 3 days. Remove infected plant parts.";
  if (disease === "Powdery Mildew") return "Apply sulfur-based fungicide or neem oil. Improve air circulation.";
  if (disease === "Leaf Spot") return "Apply copper-based fungicide. Remove infected leaves. Avoid wetting foliage.";
  return "Upload a clearer leaf image for accurate diagnosis.";
}

export default function AdvisorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [soil, setSoil] = useState<string>(SOIL_OPTIONS[0]);
  const [temperature, setTemperature] = useState(28);
  const [rainfall, setRainfall] = useState(800);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);
  const [baseYield, setBaseYield] = useState<number | null>(null);
  const [adjustedYield, setAdjustedYield] = useState<number | null>(null);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [bestMarket, setBestMarket] = useState<MarketRow | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [aiCost, setAiCost] = useState<string | null>(null);
  const [aiUrgency, setAiUrgency] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mandiError, setMandiError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [profile, setProfile] = useState<{ location?: { latitude?: number; longitude?: number } } | null>(null);
  const [riskResponse, setRiskResponse] = useState<{
    weather: { temperature: number | null; humidity: number | null; rainfall: number | null };
    risk: { risk_level: string; probability: number; reason: string };
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setProfile(p && Object.keys(p).length > 0 ? (p as { location?: { latitude?: number; longitude?: number } }) : null))
      .catch(() => setProfile(null));
  }, []);

  const healthScore = diseaseResult ? healthScoreFromSeverity(diseaseResult.severity) : null;
  const yieldLossPct = diseaseResult ? yieldLossPercent(diseaseResult.severity) : 0;

  const startCamera = useCallback(() => {
    setCameraActive(true);
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setError("Camera access denied or unavailable.");
        setCameraActive(false);
      });
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setImagePreview(canvas.toDataURL("image/jpeg"));
    stopCamera();
  }, [stopCamera]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImagePreview(URL.createObjectURL(file));
    resetResults();
  };

  const selectDemoImage = (src: string) => {
    setImagePreview(src);
    resetResults();
  };

  const resetResults = () => {
    setDiseaseResult(null);
    setBaseYield(null);
    setAdjustedYield(null);
    setMarkets([]);
    setBestMarket(null);
    setRecommendation("");
    setAiCost(null);
    setAiUrgency(null);
    setError(null);
    setMandiError(null);
    setRiskResponse(null);
    setCurrentStep(0);
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runFullAnalysis = async () => {
    if (!imagePreview) { setError("Please upload or scan a crop leaf image first."); return; }
    setError(null);
    setMandiError(null);
    setIsLoading(true);
    resetResults();

    try {
      // Step 1 — prep
      setCurrentStep(1);
      await delay(400);

      // Step 2 — disease detection
      setCurrentStep(2);
      const disease = await runDiseaseInference(imagePreview);
      setDiseaseResult(disease);
      const profileForRisk = profile ?? (await getProfile().catch(() => null));
      const loc = (profileForRisk as { location?: { latitude?: number; longitude?: number } } | null)?.location;
      const lat = loc?.latitude;
      const lon = loc?.longitude;
      if (typeof lat === "number" && typeof lon === "number") {
        try {
          const risk = await getRiskPrediction({ crop_type: crop, latitude: lat, longitude: lon });
          setRiskResponse(risk);
        } catch {
          setRiskResponse(null);
        }
      } else {
        setRiskResponse(null);
      }
      await delay(300);

      // Step 3 — yield prediction
      setCurrentStep(3);
      const params: YieldParams = { crop, soil, temperature, rainfall, farmSize: 10 };
      const base = predictYield(params);
      const adjusted = adjustYieldBySeverity(base, disease.severity);
      setBaseYield(base);
      setAdjustedYield(adjusted);
      await delay(300);

      // Step 4 — mandi data
      setCurrentStep(4);
      let fetchedMarkets: MarketRow[] = [];
      let best: MarketRow | null = null;
      try {
        const records = await fetchMandiPrices(crop, "Uttar Pradesh");
        fetchedMarkets = records
          .map((r: Record<string, string>, i: number) => ({
            market: r.market ?? "Unknown",
            district: r.district ?? "Unknown",
            price: Number(r.modal_price ?? 0),
            distanceKm: 10 + i * 12,
            profitPerQuintal: 0,
          }))
          .filter((m) => Number.isFinite(m.price) && m.price > 0)
          .sort((a, b) => b.price - a.price)
          .slice(0, 10)
          .map((m) => ({ ...m, profitPerQuintal: m.price - m.distanceKm * TRANSPORT_COST_PER_KM }));
        best = fetchedMarkets.length
          ? fetchedMarkets.reduce((a, b) => (b.profitPerQuintal > a.profitPerQuintal ? b : a))
          : null;
      } catch (err) {
        console.error("Mandi API failed:", err);
        setMandiError("Unable to load government mandi data. Please try again later.");
      }
      setMarkets(fetchedMarkets);
      setBestMarket(best);
      await delay(200);

      // Step 5 — recommendation
      setCurrentStep(5);
      const lossPct = yieldLossPercent(disease.severity);
      const treatment = getTreatment(disease.disease);
      const marketLine = best
        ? `Best Market Today: ${best.market} (${best.district})\nExpected Price: ₹${best.price} per quintal\nEstimated Profit: ₹${best.profitPerQuintal} per quintal (after transport)`
        : "Market data unavailable. Please retry for market recommendation.";
      const contextQuery =
        `Generate a practical 7-day action plan for this farmer.\n\n` +
        `Crop: ${crop}\n` +
        `Disease detected: ${disease.disease}${disease.rawClass !== disease.disease ? ` (${disease.rawClass})` : ""}\n` +
        `Severity: ${getSeverityLabel(disease.severity)}\n` +
        `Estimated yield loss: ${lossPct}%\n` +
        `Expected yield (post-impact): ${adjusted} tons/hectare\n\n` +
        `${marketLine}\n\n` +
        `Give field-ready steps (what to do today, what to spray if needed, safety). ` +
        `Make cost estimate scale to the farmer's farm area if available.`;

      try {
        const ai = await getAIAgentResponse({
          query: contextQuery,
          disease: disease.disease,
          risk: riskResponse,
        });
        setAiCost(ai.estimated_cost ?? null);
        setAiUrgency(ai.urgency ?? null);
        setRecommendation(
          `AI FARM RECOMMENDATION\n\n` +
            `Urgency: ${ai.urgency}\n` +
            `Estimated cost: ${ai.estimated_cost}\n\n` +
            `${ai.advice}\n\n` +
            `Recommended action:\n${ai.recommended_action}`
        );
      } catch {
        const sellAdvice = best ? `${treatment} Sell crop at ${best.market} for maximum profit.` : treatment;
        setRecommendation(
          `AI FARM RECOMMENDATION\n\nCrop: ${crop}\nDisease Detected: ${disease.disease}${disease.rawClass !== disease.disease ? ` (${disease.rawClass})` : ""}\nSeverity: ${getSeverityLabel(disease.severity)}\n\nEstimated Yield Loss: ${lossPct}%\nExpected Yield: ${adjusted} tons per hectare\n\n${marketLine}\n\nRecommendation:\n${sellAdvice}`
        );
      }
      await delay(200);
    } catch (err) {
      console.error("Advisor analysis failed:", err);
      setError("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display flex items-center gap-2 text-sm font-semibold text-[#00C3FF] transition-colors hover:text-[#00FF9C]">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <span className="font-display text-lg font-bold text-white">
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AI Farmer <span className="text-gradient">Advisor</span>
          </h1>
          <p className="mt-2 text-gray-400">Crop health, yield impact, and best market — one system.</p>
        </motion.div>

        <div className="mb-6 space-y-4">
          <AlertBanner
            show={
              riskResponse?.risk?.risk_level === "High" ||
              diseaseResult?.severity === "Severe"
            }
          />
          <WeatherCard weather={riskResponse?.weather ?? null} />
          {riskResponse?.risk && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm font-medium text-gray-300">
                Weather-based risk:{" "}
                <span className="text-[#00FF9C]">{riskResponse.risk.risk_level}</span> (
                {Math.round(riskResponse.risk.probability * 100)}%)
              </p>
              <p className="mt-1 text-xs text-gray-400">{riskResponse.risk.reason}</p>
            </div>
          )}
        </div>

        {/* ── Loading overlay ── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card neon-border mb-6 rounded-2xl p-6"
            >
              <div className="space-y-3">
                {ANALYSIS_STEPS.map((s) => {
                  const Icon = s.icon;
                  const isDone = currentStep > s.id;
                  const isActive = currentStep === s.id;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: s.id * 0.05 }}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${
                        isDone ? "bg-[#00FF9C]/10 text-[#00FF9C]" : isActive ? "bg-amber-500/10 text-amber-300" : "text-gray-600"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00FF9C]" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span>{s.label}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-[#00FF9C] to-[#00C3FF]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(currentStep / 5) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
          </motion.div>
        )}

        {/* ── Step 1 — Upload / Scan / Demo ── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card neon-border mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
            <ImageIcon className="h-5 w-5 text-[#00FF9C]" /> Step 1 — Upload or scan crop leaf
          </h2>

          {!cameraActive ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-8 py-6 transition-colors hover:border-[#00FF9C]/50 hover:bg-white/10">
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-400">Choose file</span>
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              <button type="button" onClick={startCamera}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#00FF9C]/40 bg-[#00FF9C]/10 px-6 py-4 font-medium text-[#00FF9C] transition-colors hover:bg-[#00FF9C]/20">
                <Camera className="h-5 w-5" /> Scan Crop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video max-w-md overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 rounded-xl border-2 border-dashed border-[#00FF9C]/60" />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Place leaf inside the frame</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={captureFromCamera} className="rounded-xl bg-[#00FF9C] px-4 py-2 font-semibold text-[#0A0F1F]">Capture</button>
                <button type="button" onClick={stopCamera} className="rounded-xl border border-white/30 px-4 py-2 text-gray-300">Cancel</button>
              </div>
            </div>
          )}

          {/* Demo images row */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Quick test with demo leaves</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_IMAGES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => selectDemoImage(d.src)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    imagePreview === d.src ? "border-[#00FF9C]/60 bg-[#00FF9C]/20 text-[#00FF9C]" : "border-white/15 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {imagePreview && (
            <div className="mt-4 flex items-center gap-3">
              <img src={imagePreview} alt="Leaf" className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
              <div>
                <span className="text-sm font-medium text-white">Image ready</span>
                <p className="text-xs text-gray-500">Select crop parameters below and run analysis</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Crop & yield params ── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card neon-border mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
            <Sprout className="h-5 w-5 text-[#00FF9C]" /> Crop &amp; yield parameters
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Crop</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#00FF9C]/50">
                {CROP_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0A0F1F]">{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Soil type</label>
              <select value={soil} onChange={(e) => setSoil(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#00FF9C]/50">
                {SOIL_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0A0F1F]">{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Temperature (°C)</label>
              <input type="number" value={temperature} onChange={(e) => setTemperature(Number(e.target.value) || 28)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#00FF9C]/50" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Rainfall (mm)</label>
              <input type="number" value={rainfall} onChange={(e) => setRainfall(Number(e.target.value) || 800)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#00FF9C]/50" />
            </div>
          </div>
          <div className="mt-5">
            <button type="button" onClick={runFullAnalysis} disabled={!imagePreview || isLoading}
              className="btn-glow-primary flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF9C] py-3.5 font-display font-semibold text-[#0A0F1F] transition-all disabled:opacity-50 sm:w-auto sm:px-10">
              {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing…</> : <><Sparkles className="h-5 w-5" /> Run Full AI Analysis</>}
            </button>
          </div>
        </motion.section>

        {/* ── Results ── */}
        <AnimatePresence mode="wait">
          {diseaseResult && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

              {/* Farm Health Dashboard */}
              <section>
                <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <ShieldCheck className="h-5 w-5 text-[#00FF9C]" /> Farm Health Dashboard
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Health Score */}
                  <div className="glass-card rounded-xl border border-white/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Health Score</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: getHealthColor(healthScore ?? 0) }}>{healthScore ?? 0}%</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: getHealthColor(healthScore ?? 0) }}
                        initial={{ width: 0 }} animate={{ width: `${healthScore ?? 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                    </div>
                  </div>

                  {/* Disease Risk */}
                  <div className="glass-card rounded-xl border border-white/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Disease Risk</span>
                    </div>
                    <p className={`text-lg font-bold ${getSeverityColor(diseaseResult.severity)}`}>{getSeverityLabel(diseaseResult.severity)}</p>
                    <div className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityBg(diseaseResult.severity)} ${getSeverityColor(diseaseResult.severity)}`}>
                      {diseaseResult.disease}
                    </div>
                  </div>

                  {/* Yield Forecast */}
                  <div className="glass-card rounded-xl border border-white/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Yield Forecast</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{adjustedYield != null ? `${adjustedYield} t/ha` : "—"}</p>
                    {yieldLossPct > 0 && <p className="mt-1 text-xs text-amber-400">−{yieldLossPct}% from disease</p>}
                    {yieldLossPct === 0 && <p className="mt-1 text-xs text-[#00FF9C]">No loss — healthy crop</p>}
                  </div>

                  {/* Market Opportunity */}
                  <div className="glass-card rounded-xl border border-white/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                      <Target className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Market Opportunity</span>
                    </div>
                    {bestMarket ? (
                      <>
                        <p className="text-2xl font-bold text-[#00FF9C]">₹{bestMarket.price}/q</p>
                        <p className="mt-1 text-xs text-gray-400">{bestMarket.market}, {bestMarket.district}</p>
                      </>
                    ) : (
                      <p className="text-lg font-medium text-gray-500">{mandiError ? "API error" : "—"}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Disease Result */}
              <section className="glass-card neon-border rounded-2xl p-6">
                <h2 className="mb-3 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <Leaf className="h-5 w-5 text-[#00FF9C]" /> Disease Detection Result
                </h2>
                <div className="flex flex-wrap items-start gap-4">
                  {imagePreview && <img src={imagePreview} alt="Analyzed leaf" className="h-24 w-24 rounded-lg border border-white/10 object-cover" />}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-white">{diseaseResult.disease}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityBg(diseaseResult.severity)} ${getSeverityColor(diseaseResult.severity)}`}>
                        {getSeverityLabel(diseaseResult.severity)}
                      </span>
                    </div>
                    {diseaseResult.rawClass !== diseaseResult.disease && (
                      <p className="text-xs text-gray-500">Model class: {diseaseResult.rawClass}</p>
                    )}
                    <p className="text-sm text-gray-400">Confidence: {(diseaseResult.confidence * 100).toFixed(1)}%</p>
                    <p className="max-w-md text-sm leading-relaxed text-gray-300">{getTreatment(diseaseResult.disease)}</p>
                  </div>
                </div>
              </section>

              {/* Yield Prediction */}
              <section className="glass-card neon-border rounded-2xl p-6">
                <h2 className="mb-3 font-display flex items-center gap-2 text-lg font-semibold text-white">
                  <TrendingUp className="h-5 w-5 text-[#00FF9C]" /> Yield Prediction
                </h2>
                <div className="flex flex-wrap gap-8">
                  {baseYield != null && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">Base yield</p>
                      <p className="text-2xl font-bold text-white">{baseYield} <span className="text-sm font-normal text-gray-400">tons/hectare</span></p>
                    </div>
                  )}
                  {adjustedYield != null && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">Adjusted (disease impact)</p>
                      <p className="text-2xl font-bold text-[#00FF9C]">{adjustedYield} <span className="text-sm font-normal text-gray-400">tons/hectare</span></p>
                    </div>
                  )}
                  {yieldLossPct > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">Estimated loss</p>
                      <p className="text-2xl font-bold text-amber-400">{yieldLossPct}%</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Market Intelligence */}
              {mandiError && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  {mandiError}
                </div>
              )}
              {markets.length > 0 && (
                <section className="glass-card neon-border overflow-hidden rounded-2xl">
                  <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                    <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
                      <Store className="h-5 w-5 text-[#00FF9C]" /> Market Intelligence (Live)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-gray-400">
                          <th className="px-6 py-3 font-medium">Market</th>
                          <th className="px-6 py-3 font-medium">District</th>
                          <th className="px-6 py-3 font-medium">Price (₹/q)</th>
                          <th className="px-6 py-3 font-medium">Distance</th>
                          <th className="px-6 py-3 font-medium">Profit (₹/q)</th>
                          <th className="px-6 py-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {markets.map((m, i) => {
                          const isBest = bestMarket?.market === m.market && bestMarket?.district === m.district;
                          return (
                            <tr key={`${m.market}-${i}`} className={`border-b border-white/5 last:border-0 ${isBest ? "bg-[#00FF9C]/10" : "hover:bg-white/5"}`}>
                              <td className="px-6 py-3 font-medium text-white">{m.market}</td>
                              <td className="px-6 py-3 text-gray-400">{m.district}</td>
                              <td className="px-6 py-3 text-gray-300">₹{m.price.toLocaleString()}</td>
                              <td className="px-6 py-3 text-gray-400">{m.distanceKm} km</td>
                              <td className={`px-6 py-3 font-medium ${isBest ? "text-[#00FF9C]" : "text-gray-300"}`}>₹{m.profitPerQuintal.toLocaleString()}</td>
                              <td className="px-6 py-3">{isBest && <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF9C]/20 px-2 py-0.5 text-xs font-semibold text-[#00FF9C]"><Award className="h-3 w-3" /> Best</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Final Recommendation */}
              {recommendation && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-[#00FF9C]/50 bg-[#00FF9C]/5 p-6 shadow-[0_0_30px_rgba(0,255,156,0.15)]"
                >
                  <h2 className="mb-4 font-display flex items-center gap-2 text-lg font-semibold text-[#00FF9C]">
                    <CheckCircle2 className="h-5 w-5" /> AI Farm Recommendation
                  </h2>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">{recommendation}</pre>
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when no results */}
        {!diseaseResult && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card neon-border flex min-h-[200px] flex-col items-center justify-center rounded-2xl p-8 text-center">
            <Sparkles className="mb-3 h-12 w-12 text-white/15" />
            <p className="text-gray-500">Upload or scan a leaf, set crop parameters, then run full AI analysis.</p>
            <p className="mt-1 text-xs text-gray-600">Or use a demo leaf above to test instantly.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
