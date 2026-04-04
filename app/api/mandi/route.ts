/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Next.js API route proxy for mandi price intelligence.
 */

import { NextRequest, NextResponse } from "next/server";

const DATA_GOV_BASE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get("crop")?.trim() || "Wheat";
    const state = searchParams.get("state")?.trim() || "Uttar Pradesh";

    const apiKey =
      process.env.DATA_GOV_API_KEY ||
      process.env.NEXT_PUBLIC_DATA_GOV_API_KEY;

    if (!apiKey) {
      console.warn("Mandi API key not configured. Using high-fidelity mock data for demo.");
      
      // High-fidelity fallback for Uttar Pradesh mandis
      const mockRecords = [
        { market: "Lucknow", commodity: crop, modal_price: "2150", state: "Uttar Pradesh", district: "Lucknow" },
        { market: "Kanpur", commodity: crop, modal_price: "2080", state: "Uttar Pradesh", district: "Kanpur" },
        { market: "Varanasi", commodity: crop, modal_price: "2200", state: "Uttar Pradesh", district: "Varanasi" },
        { market: "Agra", commodity: crop, modal_price: "2110", state: "Uttar Pradesh", district: "Agra" },
        { market: "Bareilly", commodity: crop, modal_price: "2050", state: "Uttar Pradesh", district: "Bareilly" },
      ];
      return NextResponse.json(mockRecords);
    }

    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: "20",
      "filters[commodity]": crop,
      "filters[state]": state,
    });

    const res = await fetch(`${DATA_GOV_BASE}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("data.gov.in API error:", res.status, text?.slice(0, 200));
      return NextResponse.json(
        { error: "Government mandi API returned an error. Please try again later." },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid response from mandi API." },
        { status: 502 }
      );
    }

    const records = Array.isArray(data.records) ? data.records : [];
    return NextResponse.json(records);
  } catch (err) {
    console.error("Mandi API route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch mandi data. Please try again later." },
      { status: 500 }
    );
  }
}
