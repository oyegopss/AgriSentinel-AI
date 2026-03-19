/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Leaflet farm boundary drawing + polygon area calculation
 * - Persists via: `POST /api/farm` and `GET /api/farm`
 * - Bonus: Risk color overlay uses profile + `POST /api/risk-predict`
 */

"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { area } from "@turf/area";
import { polygon as turfPolygon } from "@turf/helpers";
import { getFarm, saveFarm, getRiskPrediction, getProfile, type FarmPoint } from "@/lib/api";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then((m) => m.Polygon), { ssr: false });
const MapClickHandler = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      function Inner({ onAddPoint }: { onAddPoint: (lat: number, lon: number) => void }) {
        mod.useMapEvents({
          click(e: { latlng: { lat: number; lng: number } }) {
            onAddPoint(e.latlng.lat, e.latlng.lng);
          },
        });
        return null;
      }
      return Inner;
    }),
  { ssr: false }
);

const M2_PER_ACRE = 4046.86;
const DEFAULT_CENTER: [number, number] = [26.8467, 80.9462];

function polygonAreaAcres(points: FarmPoint[]): number {
  if (points.length < 3) return 0;
  const ring = [...points.map((p) => [p.lon, p.lat]), [points[0].lon, points[0].lat]];
  const geom = turfPolygon([ring]);
  const m2 = area(geom);
  return m2 / M2_PER_ACRE;
}

function riskOverlayStyle(level: string | null): { color: string; fillColor: string; fillOpacity: number; weight: number } {
  const l = (level ?? "").toLowerCase();
  if (l.includes("high")) return { color: "#fb7185", fillColor: "#fb7185", fillOpacity: 0.22, weight: 3 };
  if (l.includes("medium")) return { color: "#fbbf24", fillColor: "#fbbf24", fillOpacity: 0.18, weight: 3 };
  return { color: "#34d399", fillColor: "#34d399", fillOpacity: 0.16, weight: 3 };
}

export default function FarmMapPage() {
  const [points, setPoints] = useState<FarmPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [riskProbability, setRiskProbability] = useState<number | null>(null);

  const areaAcres = polygonAreaAcres(points);

  const loadFarm = useCallback(async () => {
    try {
      const data = await getFarm();
      if (data?.polygon?.length) {
        setPoints(data.polygon as FarmPoint[]);
      }
    } catch {
      // keep default []
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  const addPoint = useCallback((lat: number, lon: number) => {
    setPoints((prev) => [...prev, { lat, lon }]);
  }, []);

  const clearPolygon = useCallback(() => {
    setPoints([]);
  }, []);

  const handleSave = async () => {
    if (points.length < 3) return;
    setSaving(true);
    try {
      await saveFarm({ polygon: points, area_acres: areaAcres });
    } finally {
      setSaving(false);
    }
  };

  const refreshRisk = useCallback(async () => {
    try {
      const profile = await getProfile().catch(() => ({}));
      const loc = (profile as { location?: { latitude?: number; longitude?: number } })?.location;
      const lat = loc?.latitude;
      const lon = loc?.longitude;
      const crop = (profile as { crop_types?: string[] })?.crop_types?.[0] || "Wheat";
      if (typeof lat !== "number" || typeof lon !== "number") {
        setRiskLevel(null);
        setRiskProbability(null);
        return;
      }
      const risk = await getRiskPrediction({ crop_type: crop, latitude: lat, longitude: lon });
      setRiskLevel(risk?.risk?.risk_level ?? null);
      setRiskProbability(typeof risk?.risk?.probability === "number" ? risk.risk.probability : null);
    } catch {
      setRiskLevel(null);
      setRiskProbability(null);
    }
  }, []);

  useEffect(() => {
    if (!loading) refreshRisk();
  }, [loading, refreshRisk]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00FF9C]" />
      </div>
    );
  }

  const polygonPositions = points.length >= 2
    ? [...points.map((p) => [p.lat, p.lon] as [number, number]), [points[0].lat, points[0].lon]]
    : [];

  const overlayStyle = riskOverlayStyle(riskLevel);

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-white/20 p-2 text-gray-400 transition hover:border-[#00FF9C]/50 hover:text-[#00FF9C]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            Farm <span className="text-gradient">Map</span>
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-sm text-gray-400"
        >
          Click on the map to add polygon vertices. Draw at least 3 points, then save. Area is computed from the polygon.
        </motion.p>

        <div className="glass-card neon-border overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:border-b sm:border-white/10">
            <div className="flex items-center gap-4">
              <span className="rounded-lg border border-[#00FF9C]/40 bg-[#00FF9C]/10 px-3 py-1.5 text-sm font-medium text-[#00FF9C]">
                {points.length} point{points.length !== 1 ? "s" : ""}
              </span>
              <span className="text-sm text-gray-400">
                Area: <strong className="text-white">{areaAcres.toFixed(2)}</strong> acres
              </span>
              <span className="text-sm text-gray-400">
                Risk overlay:{" "}
                <strong className="text-white">
                  {riskLevel ?? "—"}{riskProbability != null ? ` (${Math.round(riskProbability * 100)}%)` : ""}
                </strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearPolygon}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-300 transition hover:border-red-400/50 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={points.length < 3 || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00FF9C]/20 px-4 py-2 text-sm font-medium text-[#00FF9C] transition hover:bg-[#00FF9C]/30 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save farm"}
              </button>
            </div>
          </div>
          <div className="h-[420px] w-full">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <MapContainer
              {...({ center: points.length ? [points[0].lat, points[0].lon] : DEFAULT_CENTER, zoom: points.length ? 14 : 6, scrollWheelZoom: true, className: "h-full w-full" } as any)}
            >
              <TileLayer
                {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)}
              />
              <MapClickHandler onAddPoint={addPoint} />
              {polygonPositions.length >= 3 && (
                <Polygon
                  {...({ positions: polygonPositions, pathOptions: overlayStyle } as any)}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
