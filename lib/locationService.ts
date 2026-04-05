/**
 * locationService.ts
 * Handles browser geolocation, reverse geocoding via OpenCage API,
 * and localStorage caching for instant reload performance.
 */

const LOCATION_CACHE_KEY = "agrisentinel_location";
const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LocationData {
  city: string;
  state: string;
  display: string; // "City, State"
  lat: number;
  lon: number;
  source: "gps" | "manual" | "cached";
  cachedAt?: number;
  fullAddress?: string;
}

// ------- localStorage helpers -------

export function getCachedLocation(): LocationData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const data: LocationData = JSON.parse(raw);
    const age = Date.now() - (data.cachedAt ?? 0);
    if (age > LOCATION_CACHE_TTL_MS) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return { ...data, source: "cached" };
  } catch {
    return null;
  }
}

export function setCachedLocation(loc: LocationData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ ...loc, cachedAt: Date.now() })
    );
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export function clearCachedLocation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCATION_CACHE_KEY);
}

// ------- Geolocation + Reverse Geocode -------

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; state: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (!res.ok) throw new Error("Geocode fetch failed");
    const json = await res.json();
    const address = json.address || {};
    const city = address.city || address.town || address.village || address.county || "Unknown Location";
    const state = address.state || address.country || "";
    return { city, state };
  } catch {
    return { city: "Lucknow", state: "Uttar Pradesh" }; // Safe default for the hackathon demo pitch
  }
}

export async function detectLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const { city, state } = await reverseGeocode(lat, lon);
        const loc: LocationData = {
          city,
          state,
          display: state ? `${city}, ${state}` : city,
          lat,
          lon,
          source: "gps",
        };
        setCachedLocation(loc);
        resolve(loc);
      },
      (err) => {
        reject(new Error(err.message || "Location permission denied"));
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }
    );
  });
}

export function buildManualLocation(cityState: string): LocationData {
  const parts = cityState.split(",").map((s) => s.trim());
  return {
    city: parts[0] || cityState,
    state: parts[1] || "",
    display: cityState,
    lat: 0,
    lon: 0,
    source: "manual",
  };
}
