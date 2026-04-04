"use client";

/**
 * Profile Page — AgriSentinel AI
 * Editable user profile: name, location (auto/manual), farm area, crops.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  MapPin,
  Leaf,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Fingerprint,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-4 w-4 text-[#00FF9C]" />
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Editable field ────────────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readonly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readonly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readonly}
        className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 transition-all focus:outline-none focus:ring-1 ${
          readonly
            ? "border-white/5 cursor-default text-gray-500"
            : "border-white/10 focus:border-[#00FF9C]/40 focus:ring-[#00FF9C]/20"
        }`}
      />
    </div>
  );
}

// ── Crop tag ──────────────────────────────────────────────────────────────────
function CropTag({ crop, onRemove }: { crop: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#00FF9C]/20 bg-[#00FF9C]/8 px-3 py-1 text-xs font-semibold text-[#00FF9C]">
      {crop}
      <button onClick={onRemove} className="text-[#00FF9C]/50 hover:text-[#00FF9C] transition-colors">✕</button>
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { profile, user, updateProfile, refreshLocation, setManualLocation, locationLoading, locationError } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(profile?.displayName ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [farmArea, setFarmArea] = useState(String(profile?.farmArea ?? "2.5"));
  const [crops, setCrops] = useState<string[]>(profile?.crops ?? ["Wheat", "Rice"]);
  const [newCrop, setNewCrop] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [detectError, setDetectError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await updateProfile({
        displayName: name.trim() || profile?.displayName,
        farmArea: parseFloat(farmArea) || profile?.farmArea,
        crops,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDetect = async () => {
    setDetectError("");
    try {
      await refreshLocation();
      setLocation(profile?.location ?? location);
    } catch (err: any) {
      setDetectError(err.message ?? "Detection failed");
    }
  };

  const handleManualLocationSave = async () => {
    if (!location.trim()) return;
    await setManualLocation(location.trim());
  };

  const addCrop = () => {
    const c = newCrop.trim();
    if (c && !crops.includes(c)) {
      setCrops((prev) => [...prev, c]);
    }
    setNewCrop("");
  };

  const maskedUid = user?.uid
    ? `${user.uid.substring(0, 6)}••••${user.uid.slice(-4)}`
    : "—";

  return (
    <div className="min-h-screen bg-[#050A10] text-gray-200 pb-20">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#00FF9C]/6 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#00C3FF]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#00FF9C] transition-colors mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Dashboard
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">
              My <span className="text-[#00FF9C]">Profile</span>
            </h1>
            <p className="mt-1 text-xs text-gray-500">Manage your farm identity and preferences</p>
          </div>

          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF9C]/15 ring-1 ring-[#00FF9C]/30 shadow-[0_0_25px_rgba(0,255,156,0.15)]">
            <span className="font-display text-2xl font-black text-[#00FF9C]">
              {(name || "F").charAt(0).toUpperCase()}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-5"
        >
          {/* Identity */}
          <SectionCard title="Identity" icon={User}>
            <div className="space-y-4">
              <EditableField label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <EditableField label="Email Address" value={profile?.email ?? user?.email ?? ""} readonly />
              <EditableField label="User ID" value={maskedUid} readonly />
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard title="Location" icon={MapPin}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <EditableField
                    label="City, State"
                    value={location}
                    onChange={setLocation}
                    placeholder="e.g. Kanpur, Uttar Pradesh"
                  />
                </div>
              </div>

              {detectError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {detectError}
                </p>
              )}
              {locationError && (
                <p className="flex items-center gap-1.5 text-xs text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  {locationError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDetect}
                  disabled={locationLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#00FF9C] transition-all hover:bg-[#00FF9C]/10 disabled:opacity-50"
                >
                  {locationLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {locationLoading ? "Detecting..." : "Auto-detect GPS"}
                </button>
                <button
                  type="button"
                  onClick={handleManualLocationSave}
                  disabled={!location.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Manual
                </button>
              </div>

              {profile?.locationData?.source && (
                <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                  Source: {profile.locationData.source === "gps" ? "GPS detected" : profile.locationData.source === "manual" ? "Manually entered" : "Cached"}
                  {profile.locationData.lat !== 0 && profile.locationData.lon !== 0
                    ? ` · ${profile.locationData.lat.toFixed(3)}°N, ${profile.locationData.lon.toFixed(3)}°E`
                    : ""}
                </p>
              )}
            </div>
          </SectionCard>

          {/* Farm Details */}
          <SectionCard title="Farm Details" icon={Leaf}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Farm Area (acres)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#00FF9C]/40 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/20"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Crops Grown
                </label>
                <div className="flex flex-wrap gap-2">
                  {crops.map((c) => (
                    <CropTag key={c} crop={c} onRemove={() => setCrops((prev) => prev.filter((x) => x !== c))} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCrop()}
                    placeholder="Add a crop (e.g. Sugarcane)"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00FF9C]/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCrop}
                    disabled={!newCrop.trim()}
                    className="rounded-xl bg-[#00FF9C]/10 px-4 py-2.5 text-xs font-bold text-[#00FF9C] hover:bg-[#00FF9C]/20 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Save button */}
          <div className="space-y-3">
            <AnimatePresence>
              {saveError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  {saveError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="button"
              id="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00FF9C] py-4 font-display text-sm font-bold uppercase tracking-widest text-[#050A10] shadow-[0_0_25px_rgba(0,255,156,0.25)] transition-all hover:bg-[#00e08a] hover:shadow-[0_0_40px_rgba(0,255,156,0.4)] active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </button>

            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:border-white/20 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
