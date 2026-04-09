/**
 * Weather Intelligence Service
 * Fetches real-time weather and calculates farming suitability.
 */

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

export interface ForecastItem {
  date: string;
  temp: number;
  humidity: number;
  description: string;
  icon: string;
}

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
  
  // Advanced Atmospheric Metrics
  dewPoint?: number;
  visibility?: number; // in km
  cloudCover?: number; // %
  airQuality?: number; // AQI 1-5
  forecast?: ForecastItem[];
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
    dewPoint: 21,
    visibility: 10,
    cloudCover: 40,
    airQuality: 2,
    forecast: [
      { date: "Tomorrow", temp: 29, humidity: 60, description: "Sunny", icon: "01d" },
      { date: "Wed", temp: 30, humidity: 55, description: "Clear", icon: "01d" },
      { date: "Thu", temp: 28, humidity: 65, description: "Cloudy", icon: "03d" },
      { date: "Fri", temp: 27, humidity: 70, description: "Rain", icon: "10d" },
      { date: "Sat", temp: 29, humidity: 62, description: "Partly Cloudy", icon: "02d" },
    ]
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
    
    // Fetch Forecast data in parallel
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const forecastRes = await fetch(forecastUrl, { next: { revalidate: 3600 } });
    let forecast: ForecastItem[] = [];
    
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      // Filter to get one reading per day (around 12:00:00)
      const dailyData = forecastData.list.filter((item: any) => item.dt_txt.includes("12:00:00"));
      
      forecast = dailyData.slice(0, 5).map((item: any) => {
        const dateObj = new Date(item.dt * 1000);
        return {
          date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(item.main.temp),
          humidity: item.main.humidity,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        };
      });
    }

    // Fetch Air Quality if coordinates exist
    let aqi = 0;
    if (data.coord?.lat && data.coord?.lon) {
      try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${OPENWEATHER_API_KEY}`;
        const aqiRes = await fetch(aqiUrl, { next: { revalidate: 1800 } });
        if (aqiRes.ok) {
           const aqiData = await aqiRes.json();
           aqi = aqiData.list[0].main.aqi; // 1 = Good, 5 = Very Poor
        }
      } catch (err) {
        console.warn("[WeatherAPI] Failed to fetch AQI", err);
      }
    }

    // Logic for farming suitability & AI Risk
    let score = 90; // Base score
    let risk: "Green" | "Yellow" | "Red" = "Green";
    let messages: string[] = [];
    
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const rain = data.rain ? (data.rain['1h'] || 0) : 0;
    const dewPointApprox = temp - ((100 - humidity) / 5);
    const visibilityKm = (data.visibility || 10000) / 1000;
    const cloudCover = data.clouds ? data.clouds.all : 0;
    
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
      dewPoint: Math.round(dewPointApprox * 10) / 10,
      visibility: Math.round(visibilityKm * 10) / 10,
      cloudCover: cloudCover,
      airQuality: aqi || 2,
      forecast: forecast,
    };
  } catch (error) {
    return buildFallback(city, String(error));
  }
}

