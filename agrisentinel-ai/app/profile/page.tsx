/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Farmer profile UI (name, location, farm size, crops, soil)
 * - Persists via: `POST /api/profile` and `GET /api/profile`
 * - Integrates with: AI agent, risk prediction, decision engine
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Loader2, Save, User, ArrowLeft } from "lucide-react";
import { getProfile, saveProfile, getFarm, type Profile, type ProfileLocation } from "@/lib/api";

const CROP_OPTIONS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane", "Pulses", "Mustard", "Vegetables"];
const SOIL_OPTIONS = ["Loamy", "Clay", "Sandy", "Black Soil", "Red Soil", "Alluvial"];

const defaultForm: Profile = {
  name: "",
  location: null,
  farm_area_acres: 0,
  crop_types: [],
  soil_type: null,
};

export default function ProfilePage() {
  const [form, setForm] = useState<Profile>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [syncingFarm, setSyncingFarm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (cancelled) return;
        if (data && Object.keys(data).length > 0) {
          setForm({
            name: (data.name as string) ?? "",
            location: data.location ?? null,
            farm_area_acres: typeof data.farm_area_acres === "number" ? data.farm_area_acres : 0,
            crop_types: Array.isArray(data.crop_types) ? data.crop_types : [],
            soil_type: data.soil_type ?? null,
          });
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          location: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: prev.location?.label ?? undefined,
          },
        }));
        setGeoStatus("ok");
      },
      () => setGeoStatus("error")
    );
  };

  const toggleCrop = (crop: string) => {
    setForm((prev) => ({
      ...prev,
      crop_types: prev.crop_types.includes(crop)
        ? prev.crop_types.filter((c) => c !== crop)
        : [...prev.crop_types, crop],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile(form);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromMap = async () => {
    setSyncingFarm(true);
    try {
      const farm = await getFarm().catch(() => ({}));
      const area = (farm as { area_acres?: number })?.area_acres;
      if (typeof area === "number" && area > 0) {
        setForm((p) => ({ ...p, farm_area_acres: area }));
      }
    } finally {
      setSyncingFarm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00FF9C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 p-2 text-gray-400 transition hover:border-[#00FF9C]/50 hover:text-[#00FF9C]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Farmer <span className="text-gradient">Profile</span>
            </h1>
            <p className="mt-1 text-gray-400">Set your farm details for personalized advice.</p>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card neon-border rounded-2xl p-6 sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <User className="h-4 w-4" /> Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00FF9C]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/50"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPin className="h-4 w-4" /> Location
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoStatus === "loading"}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#00FF9C]/40 bg-[#00FF9C]/10 px-4 py-2 text-sm font-medium text-[#00FF9C] transition hover:bg-[#00FF9C]/20 disabled:opacity-50"
                >
                  {geoStatus === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {geoStatus === "loading" ? "Detecting…" : "Use my location"}
                </button>
                {geoStatus === "error" && (
                  <span className="text-sm text-amber-400">Location access denied or unavailable.</span>
                )}
              </div>
              {(form.location?.latitude != null || form.location?.longitude != null) && (
                <p className="mt-2 text-sm text-gray-400">
                  Lat: {form.location?.latitude?.toFixed(4)}, Lon: {form.location?.longitude?.toFixed(4)}
                </p>
              )}
              <input
                type="text"
                value={form.location?.label ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    location: { ...p.location, label: e.target.value || undefined } as ProfileLocation,
                  }))
                }
                placeholder="Location label (e.g. village name)"
                className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00FF9C]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Farm area (acres)</label>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncFromMap}
                  disabled={syncingFarm}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:border-[#00FF9C]/40 hover:text-[#00FF9C] disabled:opacity-50"
                >
                  {syncingFarm ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Use farm-map area
                </button>
                <Link href="/farm-map" className="text-sm font-medium text-[#00FF9C] hover:underline">
                  Open farm map →
                </Link>
              </div>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.farm_area_acres || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, farm_area_acres: parseFloat(e.target.value) || 0 }))
                }
                placeholder="e.g. 2.5"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00FF9C]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/50"
              />
              <p className="mt-2 text-xs text-gray-500">
                Tip: draw your boundary in Farm Map to auto-calculate area.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Crops grown</label>
              <div className="flex flex-wrap gap-2">
                {CROP_OPTIONS.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      form.crop_types.includes(crop)
                        ? "border-[#00FF9C]/50 bg-[#00FF9C]/20 text-[#00FF9C]"
                        : "border-white/20 bg-white/5 text-gray-400 hover:border-white/40"
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Soil type</label>
              <select
                value={form.soil_type ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, soil_type: e.target.value || null }))
                }
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-[#00FF9C]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/50"
              >
                <option value="">Select soil type</option>
                {SOIL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF9C]/20 py-3 font-medium text-[#00FF9C] transition hover:bg-[#00FF9C]/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
