"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Minimize, FileText, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

export const ProfileEdit = () => {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    location: profile?.location || "",
    farmArea: profile?.farmArea || 0,
    crops: (profile?.crops || []).join(", "),
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      await updateProfile({
        ...formData,
        farmArea: Number(formData.farmArea),
        crops: formData.crops.split(",").map((c: string) => c.trim()).filter((c: string) => c !== ""),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl border border-white/10 p-8 shadow-2xl"
    >
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-white">Farmer Profile Settings</h2>
        <p className="text-sm text-gray-400">Update your farm details for more accurate AI insights.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00FF9C]/70">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-hidden transition-all focus:border-[#00FF9C]/40 focus:bg-white/10"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00FF9C]/70">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-hidden transition-all focus:border-[#00FF9C]/40 focus:bg-white/10"
                placeholder="e.g. Lucknow, UP"
                required
              />
            </div>
          </div>

          {/* Farm Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00FF9C]/70">Total Farm Area (Acres)</label>
            <div className="relative">
              <Minimize className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                step="0.1"
                value={formData.farmArea}
                onChange={(e) => setFormData({ ...formData, farmArea: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-hidden transition-all focus:border-[#00FF9C]/40 focus:bg-white/10"
                placeholder="e.g. 5.5"
                required
              />
            </div>
          </div>

          {/* Crops */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00FF9C]/70">Current Crops (Comma separated)</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.crops}
                onChange={(e) => setFormData({ ...formData, crops: e.target.value })}
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-hidden transition-all focus:border-[#00FF9C]/40 focus:bg-white/10"
                placeholder="Wheat, Rice, Sugarcane"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          {success && (
            <motion.p 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-sm font-semibold text-emerald-400"
            >
              <Check className="h-4 w-4" /> Profile Updated
            </motion.p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00FF9C] px-8 py-3 font-display text-sm font-bold text-[#050505] shadow-[0_0_20px_rgba(0,255,156,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
