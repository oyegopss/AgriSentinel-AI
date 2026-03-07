"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  MapPin,
  Filter,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react";

type MandiRow = {
  id: string;
  crop: string;
  mandi: string;
  pricePerQuintal: number;
  distance: number; // km
  location: string; // state/region for filter
  isRecommended?: boolean;
};

const SAMPLE_DATA: MandiRow[] = [
  { id: "1", crop: "Wheat", mandi: "Delhi (Narela)", pricePerQuintal: 2420, distance: 45, location: "North" },
  { id: "2", crop: "Wheat", mandi: "Mandi Gobindgarh", pricePerQuintal: 2380, distance: 28, location: "North" },
  { id: "3", crop: "Wheat", mandi: "Khanna (Punjab)", pricePerQuintal: 2495, distance: 52, location: "North" },
  { id: "4", crop: "Wheat", mandi: "Indore (Nanda Nagar)", pricePerQuintal: 2350, distance: 120, location: "Central" },
  { id: "5", crop: "Rice", mandi: "Chandigarh", pricePerQuintal: 1850, distance: 35, location: "North" },
  { id: "6", crop: "Rice", mandi: "Kolkata (Burdwan)", pricePerQuintal: 1920, distance: 280, location: "East" },
  { id: "7", crop: "Rice", mandi: "Raipur (Devbhog)", pricePerQuintal: 1880, distance: 95, location: "Central" },
  { id: "8", crop: "Rice", mandi: "Patna (Fatuha)", pricePerQuintal: 1985, distance: 180, location: "East" },
  { id: "9", crop: "Maize", mandi: "Nizamabad", pricePerQuintal: 2150, distance: 220, location: "South" },
  { id: "10", crop: "Maize", mandi: "Chittoor", pricePerQuintal: 2080, distance: 195, location: "South" },
  { id: "11", crop: "Maize", mandi: "Dewas", pricePerQuintal: 2220, distance: 110, location: "Central" },
  { id: "12", crop: "Soybean", mandi: "Indore", pricePerQuintal: 4250, distance: 118, location: "Central" },
  { id: "13", crop: "Soybean", mandi: "Ujjain", pricePerQuintal: 4180, distance: 95, location: "Central" },
  { id: "14", crop: "Soybean", mandi: "Latur", pricePerQuintal: 4320, distance: 340, location: "West" },
  { id: "15", crop: "Groundnut", mandi: "Rajkot", pricePerQuintal: 5850, distance: 280, location: "West" },
  { id: "16", crop: "Groundnut", mandi: "Junagadh", pricePerQuintal: 5720, distance: 310, location: "West" },
  { id: "17", crop: "Groundnut", mandi: "Vijayawada", pricePerQuintal: 5910, distance: 250, location: "South" },
  { id: "18", crop: "Cotton", mandi: "Yavatmal", pricePerQuintal: 6850, distance: 380, location: "West" },
  { id: "19", crop: "Cotton", mandi: "Warangal", pricePerQuintal: 6720, distance: 320, location: "South" },
  { id: "20", crop: "Cotton", mandi: "Sirsa", pricePerQuintal: 6980, distance: 85, location: "North" },
];

const CROP_OPTIONS = ["All", ...new Set(SAMPLE_DATA.map((r) => r.crop))];
const LOCATION_OPTIONS = ["All", ...new Set(SAMPLE_DATA.map((r) => r.location))];

/** For each crop in filtered data, mark the row with highest price as recommended */
function withRecommended(rows: MandiRow[]): MandiRow[] {
  const byCrop = new Map<string, MandiRow[]>();
  for (const r of rows) {
    const list = byCrop.get(r.crop) ?? [];
    list.push(r);
    byCrop.set(r.crop, list);
  }
  const recommendedIds = new Set<string>();
  byCrop.forEach((list) => {
    const best = list.reduce((a, b) => (a.pricePerQuintal >= b.pricePerQuintal ? a : b));
    recommendedIds.add(best.id);
  });
  return rows.map((r) => ({ ...r, isRecommended: recommendedIds.has(r.id) }));
}

export default function MandiIntelligencePage() {
  const [cropFilter, setCropFilter] = useState<string>("All");
  const [locationFilter, setLocationFilter] = useState<string>("All");

  const filteredRows = useMemo(() => {
    let rows = SAMPLE_DATA.filter((r) => {
      if (cropFilter !== "All" && r.crop !== cropFilter) return false;
      if (locationFilter !== "All" && r.location !== locationFilter) return false;
      return true;
    });
    return withRecommended(rows);
  }, [cropFilter, locationFilter]);

  const stats = useMemo(() => {
    if (filteredRows.length === 0) return { avgPrice: 0, bestPrice: 0, count: 0 };
    const prices = filteredRows.map((r) => r.pricePerQuintal);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const bestPrice = Math.max(...prices);
    return { avgPrice, bestPrice, count: filteredRows.length };
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/90 backdrop-blur-xl">
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
            Mandi <span className="text-gradient">Intelligence</span>
          </h1>
          <p className="mt-1 text-gray-400">
            Compare mandi prices and find the best market for your crop.
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Mandis shown
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {stats.count}
            </p>
          </div>
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Avg. price (₹/q)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[#00C3FF]">
              ₹{Math.round(stats.avgPrice).toLocaleString()}
            </p>
          </div>
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Best price (₹/q)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[#00FF9C]">
              ₹{stats.bestPrice.toLocaleString()}
            </p>
          </div>
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Crops
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {new Set(filteredRows.map((r) => r.crop)).size}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card neon-border mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="h-5 w-5" />
            <span className="font-display text-sm font-semibold">Filters</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Crop</label>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00FF9C]/50"
              >
                {CROP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0A0F1F]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00C3FF]/50"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0A0F1F]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card neon-border overflow-hidden rounded-2xl"
        >
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <BarChart3 className="h-5 w-5 text-[#00FF9C]" />
              Price comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Store className="mb-3 h-12 w-12 text-white/20" />
                <p>No mandis match the selected filters.</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                    <th className="px-6 py-4 font-display font-semibold">Crop</th>
                    <th className="px-6 py-4 font-display font-semibold">Mandi</th>
                    <th className="px-6 py-4 font-display font-semibold">Price per quintal</th>
                    <th className="px-6 py-4 font-display font-semibold">Distance</th>
                    <th className="px-6 py-4 font-display font-semibold">Recommended market</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * index }}
                      className={`border-b border-white/5 transition-colors last:border-0 ${
                        row.isRecommended
                          ? "bg-[#00FF9C]/10 border-l-4 border-l-[#00FF9C]"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-white">{row.crop}</td>
                      <td className="px-6 py-4 text-gray-300">{row.mandi}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            row.isRecommended
                              ? "font-display font-semibold text-[#00FF9C]"
                              : "text-gray-300"
                          }
                        >
                          ₹{row.pricePerQuintal.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{row.distance} km</td>
                      <td className="px-6 py-4">
                        {row.isRecommended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF9C]/20 px-3 py-1 text-xs font-semibold text-[#00FF9C]">
                            <Award className="h-3.5 w-3.5" />
                            Best price
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Sample data for demonstration. Connect to live mandi APIs for real-time prices.
        </p>
      </main>
    </div>
  );
}
