"use client";

/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Yield prediction screen (baseline vs adjusted) and context wiring.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Ruler,
  Wheat,
  Layers,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "@/lib/AuthProvider";
import { fetchWeather } from "@/lib/weatherApi";

const CROP_OPTIONS = ["Wheat", "Rice", "Maize", "Sugarcane", "Cotton"] as const;
const SOIL_OPTIONS = ["Loamy", "Clay", "Sandy", "Black Soil"] as const;

/** Mock ML: deterministic formula → tons/hectare */
function mockPredictYield(params: {
  crop: string;
  soil: string;
  temperature: number;
  rainfall: number;
  farmSize: number;
}): {
  yieldPerHectare: number;
  barValues: { label: string; value: number }[];
  recommendation: string;
} {
  const { crop, soil, temperature, rainfall } = params;
  const cropBase: Record<string, number> = {
    Wheat: 4.2,
    Rice: 4.5,
    Maize: 5.0,
    Sugarcane: 70,
    Cotton: 0.45,
  };
  const soilMult: Record<string, number> = {
    Loamy: 1.1,
    Clay: 1.0,
    Sandy: 0.75,
    "Black Soil": 1.2,
  };
  const base = cropBase[crop] ?? 4;
  const mult = soilMult[soil] ?? 1;
  const tempFactor =
    temperature >= 20 && temperature <= 32
      ? 1
      : temperature > 32
        ? Math.max(0.5, 1 - 0.02 * (temperature - 32))
        : Math.max(0.5, 0.9 + 0.005 * (temperature - 15));
  const rainFactor =
    rainfall >= 600 && rainfall <= 1200 ? 1 : rainfall < 400 ? 0.7 : 0.9;
  const yieldPerHectare =
    Math.round(
      base * mult * Math.max(0.5, tempFactor) * Math.max(0.5, rainFactor) * 100
    ) / 100;

  const maxBar = crop === "Sugarcane" ? 80 : 8;
  const barValues = [
    { label: "Crop potential", value: Math.min(base, maxBar) },
    { label: "Soil", value: mult * (maxBar * 0.15) },
    { label: "Temperature", value: tempFactor * (maxBar * 0.2) },
    { label: "Rainfall", value: rainFactor * (maxBar * 0.2) },
  ];

  const aboveAverage = yieldPerHectare >= base * 0.95;
  const recommendation = aboveAverage
    ? "Based on current conditions, your crop yield is expected to be above regional average."
    : "Based on current conditions, consider improving irrigation or soil amendments to reach regional average.";

  return { yieldPerHectare, barValues, recommendation };
}

export default function YieldPredictionPage() {
  const { profile } = useAuth();
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [soil, setSoil] = useState<string>(SOIL_OPTIONS[0]);
  const [temperature, setTemperature] = useState<string>("28");
  const [rainfall, setRainfall] = useState<string>("800");
  const [farmSize, setFarmSize] = useState<string>("10");
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof mockPredictYield> | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Auto-populate from farmer profile + live weather
  useEffect(() => {
    let cancelled = false;
    const populate = async () => {
      // 1. Crop from profile
      if (profile?.crops && profile.crops[0]) {
        const profileCrop = CROP_OPTIONS.find(c =>
          c.toLowerCase() === (profile.crops![0] || "").toLowerCase()
        );
        if (profileCrop) setCrop(profileCrop);
      }

      // 2. Farm size from profile (convert acres → hectares)
      if (profile?.farmArea) {
        setFarmSize(String(Math.round((profile.farmArea * 0.4047) * 10) / 10));
      }

      // 3. Live weather for temperature & rainfall estimate
      try {
        const city = profile?.locationData?.city || profile?.location || "Lucknow";
        const w = await fetchWeather(city);
        if (!cancelled && w?.temp) {
          setTemperature(String(Math.round(w.temp)));
          // Estimate rainfall from humidity/rain for the ML formula
          const estRainfall = Math.round(w.humidity * 10 + (w.rain || 0) * 50);
          setRainfall(String(Math.min(2000, Math.max(400, estRainfall))));
          setPrefilled(true);
        }
      } catch (err) {
        console.error("Yield Pre-fill: Weather fetch failed", err);
      }
    };
    if (profile) populate();
    return () => { cancelled = true; };
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setResult(null);
    setTimeout(() => {
      setResult(
        mockPredictYield({
          crop,
          soil,
          temperature: Number(temperature) || 28,
          rainfall: Number(rainfall) || 800,
          farmSize: Number(farmSize) || 10,
        })
      );
      setIsPredicting(false);
    }, 2000);
  };

  const maxBarValue = result
    ? Math.max(...result.barValues.map((b) => b.value), 1)
    : 1;

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

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AI Crop <span className="text-gradient">Yield Prediction</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Predict expected crop production using soil and weather data.
          </p>
        </motion.div>

        {/* Centered glassmorphism card – form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card neon-border rounded-2xl p-6 transition-all duration-300 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pre-fill notice */}
            {prefilled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 px-4 py-2.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00FF9C] shrink-0" />
                <p className="text-[11px] font-bold text-[#00FF9C]">
                  Pre-filled from your farm profile & live weather
                  <span className="font-normal text-gray-400 ml-1">— adjust if needed.</span>
                </p>
              </motion.div>
            )}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Wheat className="h-4 w-4 text-[#00FF9C]" />
                Crop Type
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/30"
              >
                {CROP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0A0F1F]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Layers className="h-4 w-4 text-[#00C3FF]" />
                Soil Type
              </label>
              <select
                value={soil}
                onChange={(e) => setSoil(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#00C3FF]/50 focus:ring-1 focus:ring-[#00C3FF]/30"
              >
                {SOIL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0A0F1F]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Thermometer className="h-4 w-4 text-[#00FF9C]" />
                Average Temperature (°C)
              </label>
              <input
                type="number"
                min="10"
                max="45"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Droplets className="h-4 w-4 text-[#00C3FF]" />
                Rainfall (mm)
              </label>
              <input
                type="number"
                min="200"
                max="2500"
                step="50"
                value={rainfall}
                onChange={(e) => setRainfall(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#00C3FF]/50 focus:ring-1 focus:ring-[#00C3FF]/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Ruler className="h-4 w-4 text-[#1BFF00]" />
                Farm Area (hectares)
              </label>
              <input
                type="number"
                min="0.5"
                max="500"
                step="0.5"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#1BFF00]/50 focus:ring-1 focus:ring-[#1BFF00]/30"
              />
            </div>

            {/* Predict Yield – glowing neon green hover */}
            {!isPredicting ? (
              <motion.button
                type="submit"
                className="btn-glow-primary mt-6 w-full rounded-xl bg-[#00FF9C] py-4 font-display text-lg font-semibold text-[#0A0F1F] transition-all hover:bg-[#00e08a]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predict Yield
                </span>
              </motion.button>
            ) : (
              <div className="mt-6">
                <LoadingSpinner message="Running ML yield prediction model…" />
              </div>
            )}
          </form>
        </motion.div>

        {/* Prediction output card – after 2 seconds */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card neon-border mt-8 rounded-2xl p-6 transition-all duration-300 sm:p-8"
            >
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-400">
                Predicted Yield
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-[#00FF9C] sm:text-5xl">
                  {result.yieldPerHectare}
                </span>
                <span className="text-xl text-gray-400">tons per hectare</span>
              </div>

              {/* Small bar chart – expected production */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-gray-400">
                  Expected production factors
                </p>
                <div className="space-y-3">
                  {result.barValues.map((bar, i) => (
                    <div key={bar.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-400">{bar.label}</span>
                        <span className="text-white">{bar.value.toFixed(1)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (bar.value / maxBarValue) * 100)}%`,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1 * i,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="h-full rounded-full bg-linear-to-r from-[#00FF9C] to-[#00C3FF]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-6 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 p-4">
                <p className="text-sm leading-relaxed text-gray-300">
                  {result.recommendation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
