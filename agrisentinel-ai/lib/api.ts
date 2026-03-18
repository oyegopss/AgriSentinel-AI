const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8002";

async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.detail || body.error || JSON.stringify(body);
    } catch {
      detail = await res.text();
    }
    throw new Error(`Backend request failed (${res.status}): ${detail}`);
  }

  return (await res.json()) as T;
}

export type RiskPredictRequest = {
  crop_type: string;
  latitude: number;
  longitude: number;
};

export type RiskPredictResponse = {
  weather: {
    temperature: number | null;
    humidity: number | null;
    rainfall: number | null;
  };
  risk: {
    risk_level: string;
    probability: number;
    reason: string;
  };
};

export async function getRiskPrediction(data: RiskPredictRequest): Promise<RiskPredictResponse> {
  return apiFetch<RiskPredictResponse>("/api/risk-predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type ProfileLocation = {
  latitude?: number;
  longitude?: number;
  label?: string;
};

export type Profile = {
  name: string;
  location?: ProfileLocation | null;
  farm_area_acres: number;
  crop_types: string[];
  soil_type?: string | null;
};

export type FarmPoint = { lat: number; lon: number };

export type Farm = {
  polygon: FarmPoint[];
  area_acres?: number;
};

export async function getProfile(): Promise<Partial<Profile> | Record<string, never>> {
  return apiFetch<Partial<Profile> | Record<string, never>>("/api/profile", { method: "GET" });
}

export async function saveProfile(profile: Profile): Promise<Partial<Profile>> {
  return apiFetch<Partial<Profile>>("/api/profile", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function getFarm(): Promise<Partial<Farm> | Record<string, never>> {
  return apiFetch<Partial<Farm> | Record<string, never>>("/api/farm", { method: "GET" });
}

export async function saveFarm(farm: { polygon: FarmPoint[]; area_acres?: number }): Promise<Farm> {
  return apiFetch<Farm>("/api/farm", {
    method: "POST",
    body: JSON.stringify(farm),
  });
}

export type AIAgentRequest = {
  query: string;
  disease?: string | null;
  risk?: unknown;
};

export type AIAgentResponse = {
  advice: string;
  urgency: "Low" | "Medium" | "High" | string;
  recommended_action: string;
  estimated_cost: string;
};

export async function getAIAgentResponse(data: AIAgentRequest): Promise<AIAgentResponse> {
  return apiFetch<AIAgentResponse>("/api/ai-agent", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
