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
      return NextResponse.json(
        { error: "Mandi API key not configured. Set DATA_GOV_API_KEY or NEXT_PUBLIC_DATA_GOV_API_KEY." },
        { status: 503 }
      );
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
