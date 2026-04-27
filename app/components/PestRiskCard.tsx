"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, AlertTriangle, ShieldCheck, Loader2, Sprout, Wind } from "lucide-react";

interface PestRiskCardProps {
  cropType?: string;
  weather?: {
    temp?: number;
    humidity?: number;
    rain?: number;
    description?: string;
  } | null;
  diseaseResult?: any | null;
  loading?: boolean;
}

// ── Pest Rule Engine ─────────────────────────────────────────────────────────

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

interface PestRisk {
  level: RiskLevel;
  pest: string;
  scientificName: string;
  symptoms: string;
  preventiveSpray: string;
  dosage: string;
  costPerAcre: string;
  priority: string;
}

function computePestRisk(
  crop: string,
  humidity: number,
  temp: number,
  rain: number,
  disease: string
): PestRisk {
  const cropLower = crop.toLowerCase();
  const diseaseLower = (disease || "").toLowerCase();
  const hasViralDisease = diseaseLower.includes("viral") || diseaseLower.includes("pest") || diseaseLower.includes("mite");

  // ── Critical: disease already indicates pest presence
  if (hasViralDisease) {
    return {
      level: "Critical",
      pest: "Active Infestation Detected",
      scientificName: "Multiple species likely",
      symptoms: "Visible damage, mosaic patterns, stunted growth, webbing",
      preventiveSpray: "Neem Oil 1500 PPM + Imidacloprid 17.8% SL",
      dosage: "3 ml/L + 0.5 ml/L as tank mix",
      costPerAcre: "₹800–₹1,400",
      priority: "Immediate action required. Control vectors to prevent spread.",
    };
  }

  // ── Wheat specific rules
  if (cropLower.includes("wheat")) {
    if (humidity > 75 && temp < 22) {
      return { level: "High", pest: "Aphids (Wheat Aphid)", scientificName: "Schizaphis graminum", symptoms: "Yellowing leaves, sticky honeydew, stunted tillers", preventiveSpray: "Dimethoate 30% EC", dosage: "1 L/hectare", costPerAcre: "₹600–₹900", priority: "Spray immediately. Aphids spread BYDV virus rapidly in cool humid weather." };
    }
    if (temp > 28 && humidity > 60) {
      return { level: "Medium", pest: "Brown Wheat Mite", scientificName: "Petrobia latens", symptoms: "Silvery streaks on leaves, premature yellowing", preventiveSpray: "Dicofol 18.5% EC", dosage: "1.5 L/hectare", costPerAcre: "₹700–₹1,000", priority: "Scout weekly. Spray if 10+ mites per tiller found." };
    }
  }

  // ── Rice specific
  if (cropLower.includes("rice")) {
    if (temp > 28 && humidity > 70) {
      return { level: "High", pest: "Yellow Stem Borer", scientificName: "Scirpophaga incertulas", symptoms: "Dead heart at tillering, white ear at heading stage", preventiveSpray: "Cartap Hydrochloride 50% SP", dosage: "1 kg/hectare", costPerAcre: "₹900–₹1,300", priority: "Critical during tillering. Use pheromone traps for monitoring." };
    }
    if (humidity > 80) {
      return { level: "High", pest: "Brown Plant Hopper", scientificName: "Nilaparvata lugens", symptoms: "Circular burnt patches ('hopperburn'), plants falling", preventiveSpray: "Buprofezin 25% SC", dosage: "1.25 L/hectare", costPerAcre: "₹1,000–₹1,500", priority: "Spray at base of plants. Avoid broad-spectrum insecticides (resurgence risk)." };
    }
  }

  // ── Cotton
  if (cropLower.includes("cotton")) {
    if (temp > 30) {
      return { level: "High", pest: "Pink Bollworm", scientificName: "Pectinophora gossypiella", symptoms: "Rosette flowers, damaged bolls, pink larvae inside", preventiveSpray: "Profenofos 50% EC", dosage: "1 L/hectare", costPerAcre: "₹1,200–₹1,800", priority: "Use pheromone traps. Spray at evening when bollworms are active." };
    }
  }

  // ── Maize
  if (cropLower.includes("maize") || cropLower.includes("corn")) {
    if (humidity > 65) {
      return { level: "Medium", pest: "Fall Armyworm", scientificName: "Spodoptera frugiperda", symptoms: "Ragged leaf feeding, frass in whorl, leaf skeleton pattern", preventiveSpray: "Emamectin Benzoate 5% SG", dosage: "200 g/hectare", costPerAcre: "₹800–₹1,200", priority: "Target young larvae in whorl stage for best results." };
    }
  }

  // ── Generic rules based on weather only
  if (humidity > 80 && rain > 1) {
    return { level: "Medium", pest: "Slugs & Fungal Gnats", scientificName: "Deroceras spp.", symptoms: "Irregular holes in leaves, slime trails, seedling damping off", preventiveSpray: "Metaldehyde Bait 6% GR (surface broadcast)", dosage: "5 kg/hectare", costPerAcre: "₹400–₹700", priority: "Apply bait in evening. Improve field drainage to reduce habitat." };
  }

  if (humidity > 70 && temp > 25) {
    return { level: "Medium", pest: "Thrips & Whitefly", scientificName: "Thrips palmi / Bemisia tabaci", symptoms: "Silver streaking, curled leaves, honeydew deposits, sooty mold", preventiveSpray: "Spinosad 45% SC or Yellow sticky traps", dosage: "75 ml/hectare", costPerAcre: "₹500–₹900", priority: "Yellow sticky traps @ 10/acre for monitoring. Spray if threshold exceeded." };
  }

  if (temp < 15) {
    return { level: "Low", pest: "Cutworm (Overwintering)", scientificName: "Agrotis ipsilon", symptoms: "Stem cutting at soil level, wilting seedlings", preventiveSpray: "Chlorpyrifos 20% EC (soil drench)", dosage: "2 L/hectare", costPerAcre: "₹400–₹600", priority: "Low temperature limits activity. Monitor after soil warming." };
  }

  return {
    level: "Low",
    pest: "No Significant Pest Pressure",
    scientificName: "Conditions currently unfavorable",
    symptoms: "No visible symptoms expected under current weather",
    preventiveSpray: "Neem Oil 1500 PPM (prophylactic)",
    dosage: "3 ml/L every 15 days",
    costPerAcre: "₹200–₹400",
    priority: "Maintain regular scouting. Apply neem oil as a preventive measure.",
  };
}

const LEVEL_STYLES: Record<RiskLevel, { bg: string; border: string; text: string; badge: string; icon: React.ReactNode }> = {
  "Critical": { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    badge: "bg-red-500/20 border-red-500/40 text-red-300",    icon: <Bug className="h-4 w-4 text-red-400" /> },
  "High":     { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500/20 border-orange-500/40 text-orange-300", icon: <AlertTriangle className="h-4 w-4 text-orange-400" /> },
  "Medium":   { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400",  badge: "bg-amber-500/20 border-amber-500/40 text-amber-300",  icon: <Wind className="h-4 w-4 text-amber-400" /> },
  "Low":      { bg: "bg-emerald-500/10",border: "border-emerald-500/30",text: "text-emerald-400",badge: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", icon: <ShieldCheck className="h-4 w-4 text-emerald-400" /> },
};

// ── Component ────────────────────────────────────────────────────────────────

export const PestRiskCard = ({ cropType, weather, diseaseResult, loading }: PestRiskCardProps) => {
  const crop = cropType || "Wheat";
  const humidity = weather?.humidity ?? 55;
  const temp = weather?.temp ?? 26;
  const rain = weather?.rain ?? 0;
  const disease = diseaseResult?.disease || "";

  const risk = useMemo(
    () => computePestRisk(crop, humidity, temp, rain, disease),
    [crop, humidity, temp, rain, disease]
  );

  const styles = LEVEL_STYLES[risk.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Pest Risk Alert
          </span>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 text-gray-600 animate-spin" />
          ) : (
            <motion.div
              key={risk.level}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${styles.badge}`}
            >
              <div className={`h-1 w-1 rounded-full bg-current ${risk.level !== "Low" ? "animate-pulse" : ""}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">{risk.level} Risk</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Analyzing Conditions...</span>
          </motion.div>
        ) : (
          <motion.div key={risk.pest} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">

            {/* Pest identification */}
            <div className={`rounded-xl border p-3 ${styles.bg} ${styles.border}`}>
              <div className="flex items-start gap-2">
                {styles.icon}
                <div className="flex-1">
                  <p className="text-xs font-black text-white leading-tight">{risk.pest}</p>
                  <p className="text-[9px] text-gray-500 italic mt-0.5">{risk.scientificName}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed mt-2">{risk.symptoms}</p>
            </div>

            {/* Context inputs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Crop", val: crop, color: "text-[#00FF9C]" },
                { label: "Humidity", val: `${humidity}%`, color: humidity > 70 ? "text-amber-400" : "text-gray-300" },
                { label: "Temp", val: `${temp}°C`, color: temp > 32 ? "text-red-400" : temp < 15 ? "text-blue-400" : "text-gray-300" },
              ].map(item => (
                <div key={item.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{item.label}</p>
                  <p className={`text-[10px] font-black ${item.color} mt-0.5`}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* Preventive spray */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-[8px] font-bold uppercase tracking-widest text-violet-400/70 mb-1">Preventive Spray</p>
              <p className="text-[11px] font-black text-white">{risk.preventiveSpray}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[9px] text-gray-500">Dose: <span className="text-gray-300 font-bold">{risk.dosage}</span></p>
                <p className="text-[9px] text-emerald-400 font-bold">{risk.costPerAcre}/acre</p>
              </div>
            </div>

            {/* Priority note */}
            <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <Sprout className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-gray-400 leading-relaxed">{risk.priority}</p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
