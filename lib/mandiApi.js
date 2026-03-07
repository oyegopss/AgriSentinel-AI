const BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

/**
 * Fetch mandi prices from data.gov.in
 * @param {string} commodity
 * @param {string} [state="Uttar Pradesh"]
 * @returns {Promise<Array<Record<string, string>>>}
 */
export async function fetchMandiPrices(commodity, state = "Uttar Pradesh") {
  const API_KEY = process.env.NEXT_PUBLIC_DATA_GOV_API_KEY;
  if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_DATA_GOV_API_KEY");
  }

  const params = new URLSearchParams({
    "api-key": API_KEY,
    format: "json",
    limit: "20",
    "filters[commodity]": commodity,
    "filters[state]": state,
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch mandi data (${res.status})`);
  }

  const data = await res.json();
  if (!data || typeof data !== "object") {
    return [];
  }

  return Array.isArray(data.records) ? data.records : [];
}
