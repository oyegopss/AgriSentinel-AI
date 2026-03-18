"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Map as MapIcon, AlertTriangle } from "lucide-react";

// React-Leaflet must be imported dynamically to avoid SSR issues.
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

import "leaflet/dist/leaflet.css";

type RiskLevel = "Low" | "Medium" | "High";

type RiskPoint = {
  id: string;
  crop: string;
  risk: RiskLevel;
  lat: number;
  lon: number;
};

const DUMMY_POINTS: RiskPoint[] = [
  { id: "1", crop: "Wheat", risk: "High", lat: 26.8467, lon: 80.9462 }, // Lucknow
  { id: "2", crop: "Rice", risk: "Medium", lat: 25.5941, lon: 85.1376 }, // Patna
  { id: "3", crop: "Maize", risk: "Low", lat: 23.2599, lon: 77.4126 }, // Bhopal
  { id: "4", crop: "Tomato", risk: "High", lat: 19.076, lon: 72.8777 }, // Mumbai
  { id: "5", crop: "Potato", risk: "Medium", lat: 28.7041, lon: 77.1025 }, // Delhi
];

function colorForRisk(level: RiskLevel): string {
  if (level === "High") return "#ef4444"; // red
  if (level === "Medium") return "#facc15"; // yellow
  return "#22c55e"; // green
}

export default function RiskMapPage() {
  const center = useMemo<[number, number]>(() => [25.5, 80.5], []);

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Crop Disease <span className="text-gradient">Risk Map</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Visual overview of field-level disease risk based on weather and model outputs.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-300">
            <MapIcon className="h-4 w-4 text-[#00FF9C]" />
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#22c55e]" /> Low</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#facc15]" /> Medium</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> High</span>
            </div>
          </div>
        </motion.div>

        <section className="glass-card neon-border overflow-hidden rounded-2xl">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <MapIcon className="h-5 w-5 text-[#00FF9C]" />
              Live Risk View (demo)
            </h2>
          </div>
          <div className="h-[420px] w-full">
            <MapContainer
              {...({ center, zoom: 5, scrollWheelZoom: true, className: "h-full w-full" } as any)}
            >
              <TileLayer
                {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)}
              />
              {DUMMY_POINTS.map((p) => (
                <CircleMarker
                  key={p.id}
                  {...({ center: [p.lat, p.lon], radius: 10, pathOptions: { color: colorForRisk(p.risk), fillColor: colorForRisk(p.risk), fillOpacity: 0.7 } } as any)}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-white">Crop: {p.crop}</p>
                      <p className="flex items-center gap-1 text-gray-300">
                        <AlertTriangle className="h-3 w-3" />
                        Risk: <span className="font-semibold" style={{ color: colorForRisk(p.risk) }}>{p.risk}</span>
                      </p>
                      <p className="text-[11px] text-gray-500">Demo data – connect to /risk-predict for live integration.</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
