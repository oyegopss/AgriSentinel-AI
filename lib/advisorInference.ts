/**
 * Hackathon Demo: Advisor inference helpers.
 * - Transforms model-style outputs into advisor severity + structured recommendation text.
 */

"use client";

export type AdvisorSeverity = "Healthy" | "Mild" | "Moderate" | "Severe";

export type DiseaseResult = {
  disease: string;
  rawClass: string;
  confidence: number;
  severity: AdvisorSeverity;
};

const UI_LABELS = ["Healthy Leaf", "Leaf Spot", "Rust Disease", "Powdery Mildew"] as const;

function plantVillageToLabel(pvName: string): (typeof UI_LABELS)[number] {
  const lower = pvName.toLowerCase();
  if (lower.includes("healthy")) return "Healthy Leaf";
  if (lower.includes("rust")) return "Rust Disease";
  if (lower.includes("powdery") || lower.includes("mildew") || lower.includes("mold")) return "Powdery Mildew";
  if (lower.includes("leaf_spot") || lower.includes("leaf spot") || lower.includes("blight") || lower.includes("scab") || lower.includes("rot") || lower.includes("spot")) return "Leaf Spot";
  return "Leaf Spot";
}

function severityFromDisease(diseaseName: string, confidence: number): AdvisorSeverity {
  if (diseaseName === "Healthy Leaf") return "Healthy";
  if (diseaseName === "Uncertain Leaf Condition") return "Mild";
  if (confidence < 0.7) return "Mild";
  if (diseaseName === "Rust Disease") return "Severe";
  return "Moderate";
}

let cachedModel: import("@tensorflow/tfjs").LayersModel | null = null;
let cachedClassNames: string[] | null = null;

async function getClassNames(): Promise<string[]> {
  if (cachedClassNames && cachedClassNames.length >= 38) return cachedClassNames;
  try {
    const res = await fetch("/model/class_names.json");
    if (!res.ok) throw new Error("Not found");
    const names = await res.json();
    if (Array.isArray(names)) {
      const filtered = names.filter((n: unknown): n is string => typeof n === "string");
      if (filtered.length >= 38) {
        cachedClassNames = filtered.length === 39 && filtered[38] === "raw" ? filtered.slice(0, 38) : filtered.slice(0, 38);
        return cachedClassNames!;
      }
    }
  } catch { /* use fallback */ }
  const fallback = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
    "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
  ];
  cachedClassNames = fallback;
  return fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export async function runDiseaseInference(imageUrl: string): Promise<DiseaseResult> {
  const tf = await import("@tensorflow/tfjs");
  if (!cachedModel) {
    console.log("Loading TensorFlow model for advisor...");
    cachedModel = (await tf.loadLayersModel("/model/model.json")) as import("@tensorflow/tfjs").LayersModel;
    const warmUp = tf.zeros([1, 224, 224, 3]);
    const warmOut = cachedModel.predict(warmUp);
    tf.dispose(Array.isArray(warmOut) ? [warmUp, ...warmOut] : [warmUp, warmOut]);
    console.log("Advisor model loaded and warmed up");
  }
  const model = cachedModel;
  const classNames = await getClassNames();

  const img = await loadImage(imageUrl);
  const inputTensor = tf.tidy(() => {
    const raw = tf.browser.fromPixels(img) as import("@tensorflow/tfjs").Tensor3D;
    return tf.image.resizeNearestNeighbor(raw, [224, 224]).toFloat().div(255).expandDims(0);
  });

  const out = model.predict(inputTensor) as import("@tensorflow/tfjs").Tensor;
  const probs = Array.isArray(out) ? out[0]! : out;
  const probArr = Array.from((await probs.data()) as Float32Array);
  tf.dispose([inputTensor, probs]);

  const maxIdx = probArr.indexOf(Math.max(...probArr));
  const confidenceRaw = probArr[maxIdx] ?? 0;
  const confidence = Math.min(1, Math.max(0, confidenceRaw));
  const isUncertain = confidence < 0.55;

  const rawClassName = classNames[maxIdx] ?? `class_${maxIdx}`;
  const rawLabel = rawClassName.replace(/___/g, " — ").replace(/_/g, " ");

  const uiLabel = isUncertain
    ? "Uncertain Leaf Condition"
    : plantVillageToLabel(rawClassName);

  const severity = severityFromDisease(uiLabel, confidence);

  console.log("Predicted class:", rawClassName, "→", uiLabel, "| confidence:", confidence.toFixed(3));

  return { disease: uiLabel, rawClass: rawLabel, confidence, severity };
}

export function healthScoreFromSeverity(severity: AdvisorSeverity): number {
  switch (severity) {
    case "Healthy": return 100;
    case "Mild": return 90;
    case "Moderate": return 80;
    case "Severe": return 65;
    default: return 80;
  }
}
