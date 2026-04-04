"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  BarChart3,
  Store,
  TrendingUp,
  AlertCircle,
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
import { MandiIntelligence } from "@/app/components/MandiIntelligence";
import { DecisionEngine } from "@/app/components/DecisionEngine";
import { AlertBanner, GlobalAlert } from "@/app/components/AlertBanner";
import { VoiceInput } from "@/app/components/VoiceInput";
import { FarmMap } from "@/app/components/FarmMap";
import { DiseaseDetector } from "@/app/components/DiseaseDetector";
import { useRouter } from "next/navigation";
import { DecisionType } from "@/app/components/DecisionEngine";
import { EconomicImpact } from "@/app/components/EconomicImpact";

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
      const currentDisease = overrideDisease || diseaseResult || { disease: "Healthy", severity: "None" };
      const currentMandiPrices = [
        { market: "Local Mandi", price: 2100, distance_km: 15 },
        { market: "Central Hub", price: 2250, distance_km: 45 }
      ];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_health: currentDisease.disease,
          disease_severity: currentDisease.severity,
          weather_condition: weather?.description || "Clear",
          humidity: weather?.humidity || 50,
          mandi_prices: currentMandiPrices,
          transport_rate_per_km: 20
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Determine type based on rec string for demo visualization
        let type: DecisionType = "WAIT";
        if (data.recommendation.toLowerCase().includes("treat")) type = "TREAT";
        else if (data.recommendation.toLowerCase().includes("harvest") || data.recommendation.toLowerCase().includes("sell")) type = "SELL";
        else if (data.recommendation.toLowerCase().includes("postpone") || data.recommendation.toLowerCase().includes("drainage")) type = "CRITICAL";

        setDecisionPayload({
          decision: type,
          reasoning: data.recommendation,
          confidence: data.confidence,
          loading: false
        });
      }
    } catch (e) {
      console.error(e);
      setDecisionPayload((prev: any) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (weather && !decisionPayload.loading && !decisionPayload.decision) {
      getUnifiedDecision();
    }
  }, [weather]);

  const handleDiseaseResult = (res: any) => {
    setDiseaseResult(res);
    getUnifiedDecision(res);
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
                  <p className="text-[10px] text-gray-600 font-bold mt-1 uppercase tracking-widest">{weather?.city}</p>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Humidity</span>
                  <span className="text-white">{weather?.humidity}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00C3FF]" style={{ width: `${weather?.humidity}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Disease Upload */}
        <DiseaseDetector onResult={handleDiseaseResult} />

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
