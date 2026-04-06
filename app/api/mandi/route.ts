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

    // Function to generate high-fidelity mock data for fallback
    const getMockFallback = () => [
      { market: "Lucknow", commodity: crop, modal_price: "2150", state: "Uttar Pradesh", district: "Lucknow" },
      { market: "Kanpur", commodity: crop, modal_price: "2080", state: "Uttar Pradesh", district: "Kanpur" },
      { market: "Varanasi", commodity: crop, modal_price: "2200", state: "Uttar Pradesh", district: "Varanasi" },
      { market: "Agra", commodity: crop, modal_price: "2110", state: "Uttar Pradesh", district: "Agra" },
      { market: "Bareilly", commodity: crop, modal_price: "2050", state: "Uttar Pradesh", district: "Bareilly" },
    ];

    if (!apiKey) {
      console.warn("Mandi API key not configured. Using high-fidelity mock data for demo.");
      return NextResponse.json(getMockFallback(), {
        headers: { "X-Data-Source": "demo-no-key" }
      });
    }

    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: "20",
      "filters[commodity]": crop,
      "filters[state]": state,
    });

    try {
      const res = await fetch(`${DATA_GOV_BASE}?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("data.gov.in API error:", res.status, text?.slice(0, 200));
        console.warn("Falling back to mock data due to API error.");
        return NextResponse.json(getMockFallback(), {
          headers: { "X-Data-Source": "demo-api-error" }
        });
      }

      const data = await res.json();
      if (!data || typeof data !== "object" || !Array.isArray(data.records)) {
        console.warn("Invalid data from mandi API. Falling back to mock data.");
        return NextResponse.json(getMockFallback(), {
          headers: { "X-Data-Source": "demo-invalid-data" }
        });
      }

      // If no records found, also consider fallback for demo purposes
      if (data.records.length === 0) {
        console.info("No real records found for crop. Using mock data for demo.");
        return NextResponse.json(getMockFallback(), {
          headers: { "X-Data-Source": "demo-empty-results" }
        });
      }

      return NextResponse.json(data.records, {
        headers: { "X-Data-Source": "live-government-api" }
      });
    } catch (fetchErr) {
      console.error("Network or parse error in Mandi API:", fetchErr);
      return NextResponse.json(getMockFallback(), {
        headers: { "X-Data-Source": "demo-network-error" }
      });
    }
  } catch (err) {
    console.error("Mandi API route fatal error:", err);
    return NextResponse.json(
      { error: "Failed to process mandi request. Please try again later." },
      { status: 500 }
    );
  }
}
