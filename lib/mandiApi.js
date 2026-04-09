/**
 * Fetch mandi prices via our serverless API (which calls data.gov.in).
 * Works locally and on Vercel; API key stays on the server.
 *
 * Hackathon Demo: frontend helper for `/api/mandi` results.
 *
 * @param {string} commodity - Crop name (e.g. "Wheat", "Rice")
 * @param {string} [state="Uttar Pradesh"]
 * @param {string|null} [date=null]
 * @returns {Promise<Array<Record<string, string>>>}
 */
export async function fetchMandiPrices(commodity, state = "Uttar Pradesh", date = null) {
  const params = new URLSearchParams({
    crop: String(commodity).trim() || "Wheat",
    state: String(state).trim() || "Uttar Pradesh",
  });

  if (date) params.append("date", date);

  const url = `/api/mandi?${params.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error || `Failed to fetch mandi data (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
}
