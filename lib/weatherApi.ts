/**
 * Weather Intelligence Service
 * Fetches real-time weather and calculates farming suitability.
 */

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

export interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  rain?: number; // Rainfall in mm
  riskLevel: "Green" | "Yellow" | "Red";
  suitabilityScore: number; // 0-100
  suitabilityMessage: string;
  timestamp: string;
  isFallback?: boolean;
}

function buildFallback(city: string, reason: string): WeatherData {
  console.warn(`[WeatherAPI] Using fallback data. Reason: ${reason}`);
  return {
    temp: 28,
    description: "Partly Cloudy",
    humidity: 62,
    windSpeed: 5,
    city: city || "Your Location",
    rain: 0,
    riskLevel: "Green",
    suitabilityScore: 85,
    suitabilityMessage: "Weather data unavailable — showing estimated conditions. Add NEXT_PUBLIC_OPENWEATHER_API_KEY to .env.local.",
    timestamp: new Date().toISOString(),
    isFallback: true,
  };
}

export async function fetchWeather(city: string = "Lucknow"): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    return buildFallback(city, "API key not set. Add NEXT_PUBLIC_OPENWEATHER_API_KEY to .env.local.");
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // Cache 30 min
    
    if (!res.ok) {
      return buildFallback(city, `API responded with ${res.status} for city "${city}"`);
    }
    
    const data = await res.json();
    
    // Logic for farming suitability & AI Risk
    let score = 90; // Base score
    let risk: "Green" | "Yellow" | "Red" = "Green";
    let messages: string[] = [];
    
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const rain = data.rain ? (data.rain['1h'] || 0) : 0;
    
    // Rule 1: Temperature
    if (temp > 35) {
      score -= 20;
      messages.push("High heat alert.");
      risk = "Yellow";
    }
    
    // Rule 2: Humidity (AI Fungal Risk)
    if (humidity > 70) {
      score -= 15;
      messages.push("High fungal disease risk (Humidity > 70%).");
      risk = "Yellow";
    }

    // Rule 3: Rainfall (AI Crop Protection)
    if (rain > 0.5) {
      score -= 25;
      messages.push(`Rainfall detected (${rain}mm). Crop protection recommended.`);
      risk = rain > 2 ? "Red" : "Yellow";
    }

    // Default message if all good
    const finalMessage = messages.length > 0 ? messages.join(" ") : "Optimal conditions for agriculture.";

    return {
      temp: Math.round(temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      city: data.name,
      rain: rain,
      riskLevel: risk,
      suitabilityScore: score,
      suitabilityMessage: finalMessage,
      timestamp: new Date().toISOString(),
      isFallback: false,
    };
  } catch (error) {
    return buildFallback(city, String(error));
  }
}

