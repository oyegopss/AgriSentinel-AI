"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  BarChart3,
  Store,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  User as UserIcon,
  MapPin,
  Calendar,
  Sparkles,
  Bot,
  ArrowUpRight,
  Shield,
  Activity,
  ChevronRight,
  CloudRain,
  Zap,
  Settings,
  Brain,
  Globe,
  PieChart,
  Edit2,
  Check,
  RefreshCw,
  LogOut,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { fetchWeather, WeatherData } from "@/lib/weatherApi";
import { AlertsSystem } from "@/app/components/AlertsSystem";
import { SatelliteVisionCard } from "@/app/components/SatelliteVisionCard";
import { SoilHealthCard } from "@/app/components/SoilHealthCard";
import { FinTechCard } from "@/app/components/FinTechCard";
import { FarmHistory } from "@/app/components/FarmHistory";

import { MandiIntelligence } from "@/app/components/MandiIntelligence";
import { DecisionEngine } from "@/app/components/DecisionEngine";
import { AlertBanner, GlobalAlert } from "@/app/components/AlertBanner";
import { VoiceInput } from "@/app/components/VoiceInput";
import { FarmMap } from "@/app/components/FarmMap";
import { DiseaseDetector } from "@/app/components/DiseaseDetector";
import { useRouter } from "next/navigation";
import { DecisionType } from "@/app/components/DecisionEngine";
import { EconomicImpact } from "@/app/components/EconomicImpact";
import { calculateProfit } from "@/lib/profitEngine";
import { calculateDecisionScore } from "@/lib/decisionScore";
import { generateWeatherAlerts } from "@/lib/alertsEngine";
import { DecisionScoreCard } from "@/app/components/DecisionScoreCard";
import { ProfitSimulationCard } from "@/app/components/ProfitSimulationCard";
import { SmartAlertsCard } from "@/app/components/SmartAlertsCard";
import { BestMandiCard } from "@/app/components/BestMandiCard";
import { fetchMandiPrices } from "@/lib/mandiApi";


// ── Location Edit Modal ──────────────────────────────────────────────────────

function LocationEditModal({
  currentLocation,
  locationLoading,
  locationError,
  onClose,
  onSaveManual,
  onDetect,
}: {
  currentLocation: string;
  locationLoading: boolean;
  locationError: string | null;
  onClose: () => void;
  onSaveManual: (val: string) => void;
  onDetect: () => void;
}) {
  const [value, setValue] = useState(currentLocation);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0A0F1F] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">
            Update Location
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Auto-detect */}
          <button
            type="button"
            onClick={onDetect}
            disabled={locationLoading}
            className="flex w-full items-center gap-3 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 px-4 py-3 text-sm font-semibold text-[#00FF9C] transition-all hover:bg-[#00FF9C]/10 disabled:opacity-50"
          >
            {locationLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {locationLoading ? "Detecting location..." : "Auto-detect my location"}
          </button>

          {locationError && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {locationError} — use manual input below.
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">or enter manually</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Kanpur, Uttar Pradesh"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00FF9C]/40 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/20"
          />

          <button
            type="button"
            onClick={() => value.trim() && onSaveManual(value.trim())}
            disabled={!value.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF9C] py-3 text-sm font-bold uppercase tracking-widest text-[#0A0F1F] transition-all hover:bg-[#00e08a] disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Save Location
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, profile, loading: authLoading, syncWeather, signOut, locationLoading, locationError, refreshLocation, setManualLocation } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(profile?.lastWeather || null);
  const [loading, setLoading] = useState(true);
  const [globalAlerts, setGlobalAlerts] = useState<GlobalAlert[]>([]);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  
  // Unified flow state
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [decisionPayload, setDecisionPayload] = useState<any>({
    decision: null,
    reasoning: null,
    confidence: undefined,
    loading: false
  });

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const city = profile?.location || "Lucknow";
      const weatherData = await fetchWeather(city);
      setWeather(weatherData);
      syncWeather(weatherData);

      const alerts: GlobalAlert[] = [];
      if (weatherData.riskLevel === "Red") {
        alerts.push({ id: "1", type: "critical", message: "CRITICAL: Severe weather alert! Immediate field protection required." });
      } else if (weatherData.humidity > 70) {
        alerts.push({ id: "2", type: "warning", message: "CAUTION: Rapid humidity spike. High fungal risk today." });
      }
      setGlobalAlerts(alerts);
      setLoading(false);
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, profile?.location]);

  const handleVoiceTranscript = async (text: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          disease: diseaseResult?.disease,
          risk: { level: weather?.riskLevel, prob: weather?.suitabilityScore },
          yield_data: { current: 85 } // Placeholder for actual yield data
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.advice || data.recommendation || "I am analyzing your farm. Please wait.";
        
        // Dispatch custom event for VoiceInput to pick up
        window.dispatchEvent(new CustomEvent("agrisentinel-ai-reply", {
          detail: { text: reply }
        }));
      } else {
        throw new Error("Agent failed");
      }
    } catch (e) {
      console.error("Voice AI Error:", e);
      window.dispatchEvent(new CustomEvent("agrisentinel-ai-reply", {
        detail: { text: "I'm sorry, I encountered an error connecting to the farm intelligence center." }
      }));
    }
  };

  const getUnifiedDecision = async (overrideDisease?: any) => {
    setDecisionPayload((prev: any) => ({ ...prev, loading: true }));
    try {
      const currentDisease = overrideDisease || diseaseResult || {
        disease: "Healthy",
        severity: "No Risk",
        confidence: 0.95,
      };

      const currentCrop = (profile?.crops && profile.crops[0]) || "Wheat";
      const currentState = profile?.locationData?.state || "Uttar Pradesh";
      const apiRecords = await fetchMandiPrices(currentCrop, currentState);
      
      const currentMandiPrices = apiRecords.length > 0 
        ? apiRecords.slice(0, 5).map((r: any) => ({
            market: r.market || "Unknown Mandi",
            price: Number(r.modal_price) || 2100,
            distance_km: Math.floor(Math.random() * 40) + 5 // Mock distance as API doesn't provide it
          }))
        : [
            { market: "Lucknow (Mock)", price: 2150, distance_km: 15 },
            { market: "Kanpur (Mock)", price: 2080, distance_km: 45 },
          ];

      // ── 1. Disease Risk Signal ──────────────────────────────────────────────
      // DiseaseDetector.confidence is the model's raw prediction confidence (0–1).
      // We want a "disease risk" value: healthy = 0, severely diseased = 1.
      const rawConf = typeof currentDisease.confidence === "number"
        ? currentDisease.confidence
        : 0.8;

      const severityRaw: string = (currentDisease.severity || "").toLowerCase();
      let diseaseRisk = 0; // 0 = healthy, 1 = critical

      if (severityRaw.includes("no risk") || severityRaw === "none" || severityRaw.includes("healthy")) {
        diseaseRisk = 0;
      } else if (severityRaw.includes("low")) {
        diseaseRisk = 0.25;
      } else if (severityRaw.includes("moderate") || severityRaw === "medium" || severityRaw === "mild") {
        diseaseRisk = 0.55;
      } else if (severityRaw.includes("high") || severityRaw === "severe") {
        diseaseRisk = 0.80;
      } else if (severityRaw === "critical") {
        diseaseRisk = 1.0;
      } else {
        diseaseRisk = currentDisease.disease?.toLowerCase().includes("healthy") ? 0 : 0.5;
      }
      diseaseRisk = Math.min(1, diseaseRisk * rawConf + diseaseRisk * 0.1);

      // ── 2. Decision Score ───────────────────────────────────────────────────
      const weatherRisk = (weather?.riskLevel || "Green") as "Green" | "Yellow" | "Red";
      const yieldAmt = profile?.farmArea ? profile.farmArea * 5 : 12; // quintals

      const { score, riskLevel, recommendation } = calculateDecisionScore(
        diseaseRisk,
        weatherRisk,
        yieldAmt
      );

      // ── 3. Severity → profitEngine enum mapping ─────────────────────────────
      type ProfitSeverity = "None" | "Low" | "Medium" | "High" | "Critical";
      let mappedSeverity: ProfitSeverity = "None";

      if (severityRaw.includes("no risk") || severityRaw === "none" || severityRaw.includes("healthy")) {
        mappedSeverity = "None";
      } else if (severityRaw.includes("low")) {
        mappedSeverity = "Low";
      } else if (severityRaw.includes("moderate") || severityRaw === "medium" || severityRaw === "mild") {
        mappedSeverity = "Medium";
      } else if (severityRaw.includes("high") || severityRaw === "severe") {
        mappedSeverity = "High";
      } else if (severityRaw === "critical") {
        mappedSeverity = "Critical";
      }

      // ── 4. Profit for each mandi ────────────────────────────────────────────
      const profitsByMandi = currentMandiPrices.map((m: any) => ({
        market: m.market,
        price: m.price,
        netProfit: calculateProfit(yieldAmt, m.price, mappedSeverity).treatedProfit,
      }));

      const bestMandi = profitsByMandi.reduce((prev: any, curr: any) =>
        curr.netProfit > prev.netProfit ? curr : prev
      );
      const profitInfo = calculateProfit(yieldAmt, bestMandi.price, mappedSeverity);

      // ── 5. Smart Alerts ─────────────────────────────────────────────────────
      const generatedAlerts = generateWeatherAlerts(
        weather?.humidity ?? 50,
        weather?.rain ?? 0,
        weather?.temp
      );

      // ── 6. Final Structured Object ──────────────────────────────────────────
      const finalObject = {
        score,
        risk: riskLevel,
        recommendation,
        profitIfTreated: profitInfo.treatedProfit,
        profitIfIgnored: profitInfo.untreatedProfit,
        loss: profitInfo.lossDifference,
        alerts: generatedAlerts,
        allMandis: profitsByMandi,
        bestMandiWithNetProfit: bestMandi,
      };

      // Determine DecisionType for the hero banner
      let type: DecisionType = "WAIT";
      if (recommendation.toLowerCase().includes("immediate")) type = "TREAT";
      else if (recommendation.toLowerCase().includes("sell") || recommendation.toLowerCase().includes("harvest")) type = "SELL";
      else if (recommendation.toLowerCase().includes("emergency")) type = "CRITICAL";
      else if (recommendation.toLowerCase().includes("treatment")) type = "TREAT";

      setDecisionPayload((prev: any) => ({
        ...prev,
        decision: type,
        reasoning: recommendation,
        confidence: score / 100,
        loading: false,
        extendedData: finalObject,
      }));

      return finalObject;
    } catch (e) {
      console.error("[getUnifiedDecision]", e);
      setDecisionPayload((prev: any) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (weather && !decisionPayload.loading && !decisionPayload.decision) {
      getUnifiedDecision();
    }
    
    // Live update loop for Decision Engine
    const ticker = setInterval(() => {
      if (weather) getUnifiedDecision();
    }, 4500);

    return () => clearInterval(ticker);
  }, [weather, diseaseResult]);

  // Async so the state update (setDiseaseResult) is reflected before getUnifiedDecision reads it
  const handleDiseaseResult = async (res: any) => {
    setDiseaseResult(res);
    await getUnifiedDecision(res); // pass directly — don't rely on stale state
  };

  const dismissAlert = (id: string) => {
    setGlobalAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  const handleDetectLocation = async () => {
    await refreshLocation();
    setShowLocationEdit(false);
  };

  const handleManualLocation = async (val: string) => {
    await setManualLocation(val);
    setShowLocationEdit(false);
  };

  if (authLoading || (loading && !weather)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 animate-bounce text-[#00FF9C]" />
          <p className="mt-4 font-display text-sm text-gray-400 ai-loading-text">
            Synchronizing Farmer Intelligence Center...
          </p>
        </div>
      </div>
    );
  }

  const healthScore = weather?.suitabilityScore || 88;
  const riskLevel = weather?.riskLevel || "Green";
  const displayName = profile?.displayName || "Farmer";
  const nameInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
      <AlertBanner alerts={globalAlerts} onDismiss={dismissAlert} />

      {/* Dashboard Top Removed - Inherited from Root Layout Navbar */}

      {/* Location banner */}
      <div className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[#00FF9C]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {locationLoading
                ? "Detecting location..."
                : `Detected Location: ${profile?.location || "India"}`}
            </span>
            {!locationLoading && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] font-bold uppercase tracking-widest">
                {profile?.locationData?.source === "gps"
                  ? "GPS"
                  : profile?.locationData?.source === "manual"
                  ? "Manual"
                  : "Auto"}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowLocationEdit(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-[#00FF9C] transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">

        {/* PREDICTIVE AI BANNER (Pitch Addition) */}
        {weather && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_4s_linear_infinite]" />
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 z-10">
               <Sparkles className="h-5 w-5 text-red-400 animate-pulse" />
             </div>
             <div className="z-10 flex-1">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">Predictive AI Alert</h3>
               <p className="text-sm font-medium text-gray-200 mt-0.5">
                 {weather.humidity > 70 ? (
                   <>Based on high humidity ({weather.humidity}%) & trend analysis: <span className="font-bold text-white">Fungal Infection</span> risk spike in 3-5 days. Act now to prevent <span className="font-bold text-red-400 font-mono tracking-tight">₹{((profile?.farmArea || 2.5) * 4800).toLocaleString()}</span> yield loss.</>
                 ) : (weather?.rain || 0) > 5 ? (
                   <>Precipitation threshold exceeded: <span className="font-bold text-white">Root Rot</span> potential detected in low-lying zones. Ensure drainage to avoid <span className="font-bold text-red-400 font-mono tracking-tight">₹{((profile?.farmArea || 2.5) * 6200).toLocaleString()}</span> impact.</>
                 ) : (
                   <>Proactive Surveillance: <span className="font-bold text-white">Leaf Blight</span> risk predicted for next seasonal cycle. Early treatment saves <span className="font-bold text-red-400 font-mono tracking-tight">₹{((profile?.farmArea || 2.5) * 3500).toLocaleString()}</span> per acre.</>
                 )}
               </p>
             </div>
          </motion.div>
        )}

        {/* CROP HEALTH SCORE WIDGET (Pitch Addition) */}
        {weather && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
             <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-[0_4px_20px_rgba(16,185,129,0.05)]">
               <div className="relative flex h-14 w-14 items-center justify-center">
                 <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-400 transition-all duration-1000 ease-out" strokeDasharray="72, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 </svg>
                 <span className="text-[15px] font-black text-white">72</span>
               </div>
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Crop Health Index</p>
                 <p className="text-xl font-black text-white">72<span className="text-sm font-medium text-gray-500">/100</span></p>
               </div>
             </div>
             
             <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0a0a0a] p-5">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                 <AlertTriangle className="h-5 w-5 text-amber-500" />
               </div>
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Risk Level</p>
                 <p className="text-lg font-bold text-amber-400">Medium</p>
               </div>
             </div>

             <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0a0a0a] p-5">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20">
                 <TrendingUp className="h-5 w-5 text-[#00FF9C]" />
               </div>
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9C]/70">Profit Potential</p>
                 <p className="text-xl font-bold text-[#00FF9C] font-mono tracking-tight">₹18,000</p>
               </div>
             </div>
          </motion.div>
        )}
        
        {/* Executive ROI Summary */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00FF9C]/10 text-[#00FF9C]">
                   <Sparkles className="h-4 w-4" />
                 </div>
                 <h2 className="font-display text-xs font-black uppercase tracking-[0.2em] text-white">Actionable Executive Summary</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
                 AI Command Center Active
              </div>
           </div>
           <EconomicImpact 
             diseaseResult={diseaseResult} 
             weather={weather} 
             farmArea={profile?.farmArea || 2.5} 
           />
        </div>
        
        {/* Step 1: Environment */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 md:mb-10">
          <div className="lg:col-span-8">
            <div className="glass-card overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
              <div className="flex border-b border-white/5 bg-white/5 px-8 py-5 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C3FF]/10">
                  <Globe className="h-4 w-4 text-[#00C3FF]" />
                </div>
                <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
                  Intelligence Module 01: Environmental Surveillance
                </h3>
              </div>
              <div className="p-4">
                <FarmMap />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] h-full">
              <h3 className="font-display font-medium text-white mb-8 flex items-center gap-2 tracking-widest text-xs uppercase">
                <Thermometer className="h-4 w-4 text-[#00FF9C]" />
                Atmospheric Status
              </h3>
              <div className="flex items-end justify-between mb-8">
                <p className="text-5xl font-display font-black text-white tracking-tighter">{weather?.temp}°C</p>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.2em]">{weather?.riskLevel} Risk</p>
                  <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-widest max-w-[150px] truncate text-right ml-auto" title={profile?.locationData?.fullAddress || profile?.location || weather?.city}>
                    {profile?.locationData?.fullAddress || profile?.location || weather?.city}
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    <span>Humidity</span>
                    <span className="text-white">{weather?.humidity}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00C3FF]" style={{ width: `${weather?.humidity}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    <span>Precipitation Level</span>
                    <span className="text-white">{(weather?.rain || 0).toFixed(1)} mm</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (weather?.rain || 0) * 5)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Disease Upload */}
        <DiseaseDetector onResult={handleDiseaseResult} weather={weather} profile={profile} />

        {/* Intelligence Module 01.5: Deep Tech Integrations (Pitch Features) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
               <span className="text-blue-400 font-black text-xs">AI</span>
            </div>
            <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
              Intelligence Module: Advanced Integrations
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
             <SatelliteVisionCard />
             <SoilHealthCard />
             <FinTechCard />
          </div>
        </div>

        {/* Intelligence Module 02: Advisor Intelligence Cards */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              <Brain className="h-4 w-4 text-gray-400" />
            </div>
            <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
              Intelligence Module 02: Advisor Analysis
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DecisionScoreCard
              score={decisionPayload.extendedData?.score ?? null}
              risk={decisionPayload.extendedData?.risk ?? null}
              recommendation={decisionPayload.extendedData?.recommendation ?? null}
              loading={decisionPayload.loading}
            />
            <ProfitSimulationCard
              profitIfTreated={decisionPayload.extendedData?.profitIfTreated ?? null}
              profitIfIgnored={decisionPayload.extendedData?.profitIfIgnored ?? null}
              loss={decisionPayload.extendedData?.loss ?? null}
              loading={decisionPayload.loading}
            />
            <SmartAlertsCard
              alerts={decisionPayload.extendedData?.alerts ?? []}
              loading={decisionPayload.loading}
            />
            <BestMandiCard
              bestMandi={decisionPayload.extendedData?.bestMandiWithNetProfit ?? null}
              allMandis={decisionPayload.extendedData?.allMandis ?? []}
              loading={decisionPayload.loading}
            />
          </div>
        </div>

        {/* Step 3: Mandi Markets */}
        <div className="mt-8">
           <div className="flex items-center gap-3 mb-6 px-2">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00FF9C]/10">
               <Store className="h-4 w-4 text-[#00FF9C]" />
             </div>
             <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
               Intelligence Module 03: Market Analytics
             </h3>
           </div>
           <MandiIntelligence />
        </div>

        {/* Floating Price Ticker Simulation */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/5 bg-[#050505]/90 backdrop-blur-xl py-2 px-6">
           <div className="flex items-center gap-10 overflow-hidden whitespace-nowrap">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[9px] tracking-widest shrink-0">
                 <Activity className="h-3 w-3" />
                 Live Market Feed:
              </div>
              <div className="flex items-center gap-8 animate-marquee">
                 {[
                   { crop: "Wheat", price: "₹2,245", trend: "+1.2%" },
                   { crop: "Rice (Basmati)", price: "₹2,840", trend: "+0.8%" },
                   { crop: "Potato", price: "₹1,450", trend: "-2.1%" },
                   { crop: "Tomato", price: "₹1,820", trend: "+12.4%" },
                   { crop: "Onion", price: "₹2,100", trend: "-1.5%" },
                   { crop: "Chilli", price: "₹3,400", trend: "+4.2%" },
                 ].map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                       <span className="text-gray-400 uppercase font-black tracking-tighter text-[10px]">{t.crop}</span>
                       <span className="text-white font-mono text-[10px]">{t.price}</span>
                       <span className={t.trend.startsWith('+') ? "text-emerald-500 text-[8px]" : "text-red-500 text-[8px]"}>{t.trend}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* The Hero: Final Decision */}
        <div className="pt-10">
          <DecisionEngine
            decision={decisionPayload.decision}
            reasoning={decisionPayload.reasoning}
            confidence={decisionPayload.confidence}
            loading={decisionPayload.loading}
          />
        </div>

        {/* Farm History (AI Data Power) */}
        <div className="pt-10">
           <FarmHistory />
        </div>

      </main>

      <VoiceInput onTranscript={handleVoiceTranscript} />
      <AlertsSystem />

      {/* Location edit modal */}
      <AnimatePresence>
        {showLocationEdit && (
          <LocationEditModal
            currentLocation={profile?.location || ""}
            locationLoading={locationLoading}
            locationError={locationError}
            onClose={() => setShowLocationEdit(false)}
            onSaveManual={handleManualLocation}
            onDetect={handleDetectLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
