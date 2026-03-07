"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Thermometer,
  Droplets,
  Ruler,
  Wheat,
  Layers,
  TrendingUp,
} from "lucide-react";

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Groundnut",
] as const;

const SOIL_OPTIONS = [
  "Alluvial",
  "Black",
  "Red",
  "Laterite",
  "Sandy",
  "Clayey",
  "Loamy",
] as const;

/** Mock ML: deterministic formula from inputs → tons/hectare */
function mockPredictYield(params: {
  crop: string;
  soil: string;
  temperature: number;
  rainfall: number;
  farmSize: number;
}): { yieldPerHectare: number; breakdown: { label: string; value: number; percent: number }[] } {
  const { crop, soil, temperature, rainfall, farmSize } = params;
  const cropBase: Record<string, number> = {
    Wheat: 4.2,
    Rice: 4.5,
    Maize: 5.0,
    Cotton: 0.45,
    Sugarcane: 70,
    Soybean: 2.2,
    Groundnut: 1.8,
  };
  const soilMult: Record<string, number> = {
    Alluvial: 1.15,
    Black: 1.2,
    Red: 0.95,
    Laterite: 0.85,
    Sandy: 0.75,
    Clayey: 1.0,
    Loamy: 1.1,
  };
  const base = cropBase[crop] ?? 4;
  const mult = soilMult[soil] ?? 1;
  const tempFactor = temperature >= 20 && temperature <= 32 ? 1 : 0.85 + (temperature > 32 ? -0.01 * (temperature - 32) : 0.005 * (20 - temperature));
  const rainFactor = rainfall >= 800 && rainfall <= 1200 ? 1 : rainfall < 500 ? 0.7 : rainfall > 1500 ? 0.85 : 0.95;
  const sizeFactor = farmSize <= 5 ? 1.05 : farmSize <= 20 ? 1 : 0.98;
  const yieldPerHectare = Math.round((base * mult * Math.max(0.5, tempFactor) * Math.max(0.5, rainFactor) * sizeFactor) * 100) / 100;
  const total = 4;
  const breakdown = [
    { label: "Crop potential", value: base, percent: Math.min(100, (base / 6) * 100) },
    { label: "Soil suitability", value: mult, percent: mult * 80 },
    { label: "Temperature", value: tempFactor, percent: Math.max(0, tempFactor * 100) },
    { label: "Rainfall", value: rainFactor, percent: Math.max(0, rainFactor * 100) },
  ];
  return { yieldPerHectare, breakdown };
}

export default function YieldPredictionPage() {
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [soil, setSoil] = useState<string>(SOIL_OPTIONS[0]);
  const [temperature, setTemperature] = useState<string>("28");
  const [rainfall, setRainfall] = useState<string>("1000");
  const [farmSize, setFarmSize] = useState<string>("10");
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof mockPredictYield> | null>(null);

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
          rainfall: Number(rainfall) || 1000,
          farmSize: Number(farmSize) || 10,
        })
      );
      setIsPredicting(false);
    }, 800 + Math.random() * 400);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Yield <span className="text-gradient">Prediction</span>
          </h1>
          <p className="mt-1 text-gray-400">
            Enter farm parameters to get AI-predicted yield in tons per hectare.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-card neon-border rounded-2xl p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF9C]/20">
                  <BarChart3 className="h-5 w-5 text-[#00FF9C]" />
                </div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Input parameters
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Wheat className="h-4 w-4 text-[#00FF9C]" />
                    Crop type
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
                    Soil type
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
                    Temperature (°C)
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
                    Rainfall (mm/year)
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
                    Farm size (hectares)
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
                <motion.button
                  type="submit"
                  disabled={isPredicting}
                  className="btn-glow-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF9C] py-3.5 font-display font-semibold text-[#0A0F1F] transition-all disabled:opacity-60 disabled:shadow-none hover:bg-[#00e08a]"
                  whileHover={!isPredicting ? { scale: 1.01 } : {}}
                  whileTap={!isPredicting ? { scale: 0.99 } : {}}
                >
                  {isPredicting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 rounded-full border-2 border-[#0A0F1F] border-t-transparent"
                      />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5" />
                      Predict Yield
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Dashboard / Results */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card neon-border flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-8 text-center"
                >
                  <BarChart3 className="mb-4 h-16 w-16 text-white/20" />
                  <p className="text-gray-500">
                    {isPredicting
                      ? "Running prediction model..."
                      : "Submit the form to see predicted yield and analytics."}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {/* Main yield card */}
                  <div className="glass-card neon-border rounded-2xl p-6">
                    <p className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                      Predicted yield
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-4xl font-bold text-[#00FF9C] sm:text-5xl">
                        {result.yieldPerHectare}
                      </span>
                      <span className="text-xl text-gray-400">tons/hectare</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, (result.yieldPerHectare / 8) * 100)}%`,
                        }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-linear-to-r from-[#00FF9C] to-[#00C3FF]"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Scale: 0–8 tons/hectare (grains). Sugarcane and similar crops use different base.
                    </p>
                  </div>

                  {/* Factor breakdown chart */}
                  <div className="glass-card neon-border rounded-2xl p-6">
                    <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
                      Factor contribution
                    </h3>
                    <div className="space-y-4">
                      {result.breakdown.map((item, i) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span className="text-gray-400">{item.label}</span>
                            <span className="font-medium text-white">
                              {item.percent.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, item.percent)}%` }}
                              transition={{
                                duration: 0.6,
                                delay: 0.1 * i,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="h-full rounded-full bg-[#00C3FF]"
                              style={{ maxWidth: "100%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-xl border border-white/10 p-4">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Crop
                      </p>
                      <p className="mt-1 font-display font-semibold text-white">{crop}</p>
                    </div>
                    <div className="glass-card rounded-xl border border-white/10 p-4">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Soil
                      </p>
                      <p className="mt-1 font-display font-semibold text-white">{soil}</p>
                    </div>
                    <div className="glass-card rounded-xl border border-white/10 p-4">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Est. total (farm)
                      </p>
                      <p className="mt-1 font-display font-semibold text-[#00FF9C]">
                        {(result.yieldPerHectare * (Number(farmSize) || 0)).toFixed(2)} tons
                      </p>
                    </div>
                    <div className="glass-card rounded-xl border border-white/10 p-4">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Farm size
                      </p>
                      <p className="mt-1 font-display font-semibold text-white">
                        {farmSize} ha
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
