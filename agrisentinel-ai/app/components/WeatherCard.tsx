"use client";

import { Thermometer, Droplets, CloudRain } from "lucide-react";

export type WeatherData = {
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
};

type Props = {
  weather: WeatherData | null | undefined;
  className?: string;
};

export default function WeatherCard({ weather, className = "" }: Props) {
  if (weather == null) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-gray-500 ${className}`}
      >
        <p className="text-sm">Weather data not available. Set location and run risk check.</p>
      </div>
    );
  }

  const temp = weather.temperature ?? "—";
  const humidity = weather.humidity ?? "—";
  const rainfall = weather.rainfall ?? "—";

  return (
    <div
      className={`glass-card neon-border rounded-2xl border p-6 transition-all duration-300 ${className}`}
    >
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-400">
        Current weather
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-[#00C3FF]/20 p-3">
            <Thermometer className="h-6 w-6 text-[#00C3FF]" />
          </div>
          <span className="text-2xl font-bold text-white">{temp}</span>
          <span className="text-xs text-gray-400">°C</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-[#00FF9C]/20 p-3">
            <Droplets className="h-6 w-6 text-[#00FF9C]" />
          </div>
          <span className="text-2xl font-bold text-white">{humidity}</span>
          <span className="text-xs text-gray-400">% humidity</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-[#1BFF00]/20 p-3">
            <CloudRain className="h-6 w-6 text-[#1BFF00]" />
          </div>
          <span className="text-2xl font-bold text-white">{rainfall}</span>
          <span className="text-xs text-gray-400">mm rain</span>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">Forecast coming soon</p>
    </div>
  );
}
