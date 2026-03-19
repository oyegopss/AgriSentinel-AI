/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Yield-impact computation helpers for the advisor pipeline
 * - Used by: advisor pages / AI decision flow
 */

"use client";

import type { AdvisorSeverity } from "./advisorInference";

const CROP_BASE: Record<string, number> = {
  Wheat: 4.2,
  Rice: 4.5,
  Maize: 5.0,
  Sugarcane: 70,
  Cotton: 0.45,
};

const SOIL_MULT: Record<string, number> = {
  Loamy: 1.1,
  Clay: 1.0,
  Sandy: 0.75,
  "Black Soil": 1.2,
};

export type YieldParams = {
  crop: string;
  soil: string;
  temperature: number;
  rainfall: number;
  farmSize: number;
};

/**
 * Base yield prediction (same logic as yield-prediction page). Tons per hectare.
 */
export function predictYield(params: YieldParams): number {
  const { crop, soil, temperature, rainfall } = params;
  const base = CROP_BASE[crop] ?? 4;
  const mult = SOIL_MULT[soil] ?? 1;
  const tempFactor =
    temperature >= 20 && temperature <= 32
      ? 1
      : temperature > 32
        ? Math.max(0.5, 1 - 0.02 * (temperature - 32))
        : Math.max(0.5, 0.9 + 0.005 * (temperature - 15));
  const rainFactor =
    rainfall >= 600 && rainfall <= 1200 ? 1 : rainfall < 400 ? 0.7 : 0.9;
  return Math.round(base * mult * Math.max(0.5, tempFactor) * Math.max(0.5, rainFactor) * 100) / 100;
}

/**
 * Adjust yield by disease severity (Mild → -5%, Moderate → -8%, Severe → -15%).
 */
export function adjustYieldBySeverity(baseYield: number, severity: AdvisorSeverity): number {
  let factor = 1;
  if (severity === "Mild") factor = 0.95;
  else if (severity === "Moderate") factor = 0.92;
  else if (severity === "Severe") factor = 0.85;
  return Math.round(baseYield * factor * 100) / 100;
}

/** Yield loss percentage for display (e.g. "8%" for Moderate). */
export function yieldLossPercent(severity: AdvisorSeverity): number {
  switch (severity) {
    case "Healthy": return 0;
    case "Mild": return 5;
    case "Moderate": return 8;
    case "Severe": return 15;
    default: return 8;
  }
}
