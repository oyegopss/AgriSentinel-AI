"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ShieldAlert, Leaf, TrendingUp, DollarSign, Loader2, CheckCircle2, ShoppingCart, X, Phone, Package } from "lucide-react";

interface TreatmentPlanCardProps {
  diseaseResult: any | null;
  cropType?: string;
  loading?: boolean;
}

// ── Pesticide Rule Engine ─────────────────────────────────────────────────────

interface TreatmentRule {
  pesticide: string;
  activeIngredient: string;
  dosage: string;
  timing: string;
  costPerAcre: string;
  recoveryPct: number;
  reEntryHours: number;
  applicationNote: string;
}

const DISEASE_CROP_RULES: Record<string, Record<string, TreatmentRule>> = {
  "Leaf Spot (Fungal)": {
    "Wheat":      { pesticide: "Mancozeb 75% WP",          activeIngredient: "Mancozeb",       dosage: "2.5 kg/hectare",   timing: "Early morning",   costPerAcre: "₹800–₹1,200",  recoveryPct: 80, reEntryHours: 12, applicationNote: "Apply every 7 days during wet season. Avoid spraying before rain." },
    "Rice":       { pesticide: "Carbendazim 50% WP",        activeIngredient: "Carbendazim",    dosage: "1 kg/hectare",     timing: "Morning or evening", costPerAcre: "₹600–₹900", recoveryPct: 75, reEntryHours: 12, applicationNote: "Mix with sticker agent. Do not apply during flowering." },
    "Maize":      { pesticide: "Chlorothalonil 75% WP",     activeIngredient: "Chlorothalonil", dosage: "2 kg/hectare",     timing: "Dry weather only", costPerAcre: "₹700–₹1,100", recoveryPct: 78, reEntryHours: 24, applicationNote: "Repeat after 10 days if symptoms persist." },
    "default":    { pesticide: "Copper Hydroxide 77% WP",   activeIngredient: "Copper",         dosage: "2.5 kg/hectare",   timing: "Early morning",   costPerAcre: "₹900–₹1,400",  recoveryPct: 74, reEntryHours: 24, applicationNote: "Broad-spectrum fungicide safe for most crops." },
  },
  "Rust Disease": {
    "Wheat":      { pesticide: "Propiconazole 25% EC",      activeIngredient: "Propiconazole",  dosage: "500 ml/hectare",   timing: "Within 3 days of detection", costPerAcre: "₹1,200–₹1,800", recoveryPct: 88, reEntryHours: 24, applicationNote: "Systemic fungicide. Apply at first sign of rust pustules." },
    "default":    { pesticide: "Tebuconazole 25.9% EC",     activeIngredient: "Tebuconazole",   dosage: "625 ml/hectare",   timing: "Morning",         costPerAcre: "₹1,500–₹2,200",  recoveryPct: 85, reEntryHours: 24, applicationNote: "Use protective gear. Avoid overlap spraying." },
  },
  "Powdery Mildew": {
    "default":    { pesticide: "Sulfur 80% WP",             activeIngredient: "Sulfur",         dosage: "3 kg/hectare",     timing: "Morning (below 32°C)", costPerAcre: "₹500–₹800", recoveryPct: 70, reEntryHours: 6, applicationNote: "Do NOT apply in temperatures above 32°C (crop burn risk). Alternatively use Neem oil 1500 ppm @ 3 ml/L." },
  },
  "Bacterial Infection": {
    "default":    { pesticide: "Copper Oxychloride 50% WP", activeIngredient: "Copper",         dosage: "3 kg/hectare",     timing: "Evening",         costPerAcre: "₹900–₹1,400",  recoveryPct: 62, reEntryHours: 24, applicationNote: "Destroy infected plant parts before spraying. Disinfect pruning tools with bleach." },
  },
  "Viral/Pest Issue": {
    "default":    { pesticide: "Imidacloprid 17.8% SL",     activeIngredient: "Imidacloprid",   dosage: "150 ml/hectare",   timing: "Early morning",   costPerAcre: "₹700–₹1,000",  recoveryPct: 55, reEntryHours: 48, applicationNote: "Targets insect vectors. Burn infected plants — do NOT compost." },
  },
  "Healthy Leaf": {
    "default":    { pesticide: "None required",             activeIngredient: "—",              dosage: "—",                timing: "—",               costPerAcre: "₹0",            recoveryPct: 100, reEntryHours: 0, applicationNote: "Crop is healthy. Continue standard monitoring and balanced fertilization." },
  },
};

function getTreatment(disease: string, crop: string): TreatmentRule {
  const diseaseKey = Object.keys(DISEASE_CROP_RULES).find(k =>
    disease?.toLowerCase().includes(k.toLowerCase().split(" ")[0]?.toLowerCase() ?? "")
  );
  if (!diseaseKey) {
    return {
      pesticide: "Consult local agronomist",
      activeIngredient: "Unknown",
      dosage: "Per label",
      timing: "As directed",
      costPerAcre: "₹500–₹2,000",
      recoveryPct: 65,
      reEntryHours: 24,
      applicationNote: "Upload a clearer leaf image for a specific recommendation.",
    };
  }
  const rules = DISEASE_CROP_RULES[diseaseKey]!;
  return rules[crop] ?? rules["default"]!;
}

// ── Component ────────────────────────────────────────────────────────────────

export const TreatmentPlanCard = ({ diseaseResult, cropType, loading }: TreatmentPlanCardProps) => {
  const isHealthy = diseaseResult?.disease?.toLowerCase().includes("healthy") ||
    diseaseResult?.disease?.toLowerCase().includes("uncertain");
  const cropName = cropType || "Wheat";
  const disease = diseaseResult?.disease || "";

  const treatment = diseaseResult ? getTreatment(disease, cropName) : null;
  const severity = diseaseResult?.severity || "";
  const confidence = diseaseResult?.confidence ? Math.round(diseaseResult.confidence * 100) : 0;

  const severityColor = severity?.includes("High") ? "text-red-400 border-red-500/30 bg-red-500/10" :
    severity?.includes("Moderate") ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Treatment Plan
          </span>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
          diseaseResult ? severityColor : "text-gray-500 border-white/10 bg-white/5"
        }`}>
          <div className={`h-1 w-1 rounded-full ${diseaseResult ? "animate-pulse" : ""} bg-current`} />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {diseaseResult ? (severity || "Analyzed") : "Awaiting Scan"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Computing Treatment...</span>
          </motion.div>
        ) : !diseaseResult ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <ShieldAlert className="h-8 w-8 text-gray-600" />
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Upload a leaf scan</p>
            <p className="text-[10px] text-gray-600">to get AI-powered treatment recommendation</p>
          </motion.div>
        ) : isHealthy ? (
          <motion.div key="healthy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400">No Treatment Needed</p>
              <p className="text-[10px] text-gray-500 mt-1">Crop is healthy. Continue standard care and monitoring.</p>
            </div>
          </motion.div>
        ) : treatment ? (
          <motion.div key="treatment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">

            {/* Disease + Crop context */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 flex items-start gap-2">
              <Leaf className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Detected Condition</p>
                <p className="text-xs font-bold text-white leading-tight mt-0.5">{disease}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Crop: <span className="text-gray-300 font-bold">{cropName}</span> · Confidence: <span className="text-violet-400 font-bold">{confidence}%</span></p>
              </div>
            </div>

            {/* Pesticide */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-[8px] font-bold uppercase tracking-widest text-violet-400/70 mb-1">Recommended Pesticide</p>
              <p className="text-sm font-black text-white">{treatment.pesticide}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Active ingredient: <span className="text-gray-300">{treatment.activeIngredient}</span></p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Dosage</p>
                <p className="text-[11px] font-black text-white">{treatment.dosage}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Apply At</p>
                <p className="text-[11px] font-black text-amber-400">{treatment.timing}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Est. Cost/Acre</p>
                <p className="text-[11px] font-black text-emerald-400">{treatment.costPerAcre}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Recovery</p>
                  <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                </div>
                <p className="text-[11px] font-black text-emerald-400">{treatment.recoveryPct}%</p>
                <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${treatment.recoveryPct}%` }} />
                </div>
              </div>
            </div>

            {/* Re-entry + Note */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 flex gap-2">
              <DollarSign className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                {treatment.reEntryHours > 0 && (
                  <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">
                    Re-entry interval: {treatment.reEntryHours}h
                  </p>
                )}
                <p className="text-[10px] text-gray-400 leading-relaxed">{treatment.applicationNote}</p>
              </div>
            </div>

            {/* Revenue CTA */}
            <BookingCTA treatment={treatment} />

          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Revenue CTA + Booking Modal ───────────────────────────────────────────────

function BookingCTA({ treatment }: { treatment: any }) {
  const [open, setOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const orderId = `AS-${Date.now().toString().slice(-6)}`;

  const handleBook = () => {
    setBooking(true);
    setTimeout(() => {
      setBooking(false);
      setConfirmed(true);
    }, 2200);
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00FF9C]/20 to-[#00C3FF]/20 border border-[#00FF9C]/30 hover:border-[#00FF9C]/60 px-4 py-3 transition-all duration-200 group"
      >
        <ShoppingCart className="h-3.5 w-3.5 text-[#00FF9C] group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-bold text-[#00FF9C] uppercase tracking-widest">Order Treatment Kit</span>
        <span className="ml-auto text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{treatment.costPerAcre}/acre</span>
      </motion.button>

      {/* Booking Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={(e) => { if (e.target === e.currentTarget && !confirmed) setOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#00FF9C]" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Order Treatment Kit</h3>
                </div>
                {!confirmed && (
                  <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {confirmed ? (
                // Confirmed state
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-4"
                >
                  <div className="h-16 w-16 rounded-full bg-[#00FF9C]/10 border-2 border-[#00FF9C] flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-[#00FF9C]" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-white mb-1">Booking Confirmed!</p>
                    <p className="text-[10px] text-gray-400">Order ID: <span className="font-mono text-[#00FF9C]">{orderId}</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">Delivery: Tomorrow by 10 AM</p>
                  </div>
                  <div className="w-full rounded-xl border border-[#00FF9C]/10 bg-[#00FF9C]/5 p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Product</span>
                      <span className="text-[10px] font-bold text-white">{treatment.pesticide}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Quantity</span>
                      <span className="text-[10px] font-bold text-white">1 Kit (5 acre pack)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Total Charged</span>
                      <span className="text-[10px] font-bold text-[#00FF9C]">{treatment.costPerAcre} × 5 acres</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <Phone className="h-3 w-3" />
                    Agri-partner will call within 30 min
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setConfirmed(false); }}
                    className="w-full rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/30 py-2.5 text-[11px] font-bold text-[#00FF9C] hover:bg-[#00FF9C]/20 transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                // Order form
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Product</span>
                      <span className="text-[11px] font-black text-white">{treatment.pesticide}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Active Ingredient</span>
                      <span className="text-[10px] text-gray-300">{treatment.activeIngredient}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Dosage</span>
                      <span className="text-[10px] text-amber-400">{treatment.dosage}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#00FF9C]/10 bg-[#00FF9C]/5 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400">5 Acre Treatment Kit</span>
                      <span className="text-sm font-black text-[#00FF9C]">{treatment.costPerAcre} × 5</span>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1">Includes: product + PPE gloves + spray schedule card</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">Delivery Details</p>
                    <input readOnly value="📍 Your Farm Location (GPS detected)" className="w-full text-[10px] text-gray-300 bg-transparent border-b border-white/10 pb-1 outline-none" />
                    <input readOnly value="📞 Linked: +91 98XXX XXXXX" className="w-full text-[10px] text-gray-300 bg-transparent border-b border-white/10 pb-1 outline-none" />
                    <input readOnly value="⏰ Delivery: Tomorrow 6–10 AM" className="w-full text-[10px] text-gray-400 bg-transparent outline-none" />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00FF9C] to-[#00C3FF] py-3 text-[12px] font-black text-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,156,0.3)] disabled:opacity-60"
                  >
                    {booking ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing Order...</>
                    ) : (
                      <><ShoppingCart className="h-4 w-4" /> Confirm Order & Pay Later</>
                    )}
                  </motion.button>
                  <p className="text-center text-[9px] text-gray-600">Secured by AgriSentinel Pay • Cash on Delivery available</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
