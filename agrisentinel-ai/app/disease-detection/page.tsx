/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Leaf disease detection UI using TFJS (MobileNet gate + disease CNN)
 * - Features: invalid/non-leaf validation, confidence trust badges, Grad-CAM heatmap
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowLeft, Leaf, AlertCircle, CheckCircle2, Flame, Loader2, Check, HelpCircle, Camera, Sparkles, Shield, Bug, Sun, Droplets, ImageIcon } from "lucide-react";
type TF = typeof import("@tensorflow/tfjs");
type MobileNetModule = typeof import("@tensorflow-models/mobilenet");

const LABELS = ["Healthy Leaf", "Leaf Spot", "Rust Disease", "Powdery Mildew"] as const;

/** Fallback PlantVillage 38-class names when /model/class_names.json is not available (order must match model output). */
const PLANTVILLAGE_38_FALLBACK: string[] = [
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

/** Map PlantVillage 38-class name to our 4 labels. */
function plantVillageToLabel(pvName: string): (typeof LABELS)[number] {
  const lower = pvName.toLowerCase();
  if (lower.includes("healthy")) return "Healthy Leaf";
  if (lower.includes("rust")) return "Rust Disease";
  if (lower.includes("powdery") || lower.includes("mildew") || lower.includes("mold")) return "Powdery Mildew";
  if (lower.includes("leaf_spot") || lower.includes("leaf spot") || lower.includes("blight") || lower.includes("scab") || lower.includes("rot") || lower.includes("spot")) return "Leaf Spot";
  return "Leaf Spot";
}

const DISEASES = [
  {
    name: "Healthy Leaf",
    treatment: "No action needed. Continue regular monitoring and maintain good irrigation and nutrition practices.",
    icon: CheckCircle2,
    color: "#00FF9C",
  },
  {
    name: "Invalid Image",
    treatment: "Please upload a clear leaf image.",
    icon: ImageIcon,
    color: "#fb7185",
    message: "⚠ This does not appear to be a valid leaf image",
  },
  {
    name: "Powdery Mildew",
    treatment: "Apply sulfur-based fungicide or neem oil. Improve air circulation, reduce humidity, and avoid overhead watering. Remove severely affected leaves.",
    icon: AlertCircle,
    color: "#00C3FF",
  },
  {
    name: "Leaf Spot",
    treatment: "Apply copper-based fungicide and remove infected leaves. Avoid wetting foliage; water at base. Ensure proper spacing for airflow.",
    icon: AlertCircle,
    color: "#FF6B6B",
  },
  {
    name: "Rust Disease",
    treatment: "Apply fungicide containing tebuconazole or azoxystrobin. Remove and destroy infected plant parts. Ensure good air circulation and avoid excess nitrogen.",
    icon: Flame,
    color: "#FFA500",
  },
  {
    name: "Uncertain Leaf Condition",
    treatment: "Please upload a clearer leaf image.",
    icon: HelpCircle,
    color: "#94A3B8",
  },
] as const;

const DEMO_LEAF_IMAGES = [
  { label: "Healthy Leaf", src: "/demo-leaves/healthy_leaf.svg" },
  { label: "Rust Disease", src: "/demo-leaves/rust_leaf.svg" },
  { label: "Powdery Mildew", src: "/demo-leaves/powdery_leaf.svg" },
  { label: "Leaf Spot", src: "/demo-leaves/leaf_spot.svg" },
] as const;

type DiseaseInsight = {
  explanation: string;
  causes: string[];
  yieldImpact: string;
  prevention: string[];
};

const AI_INSIGHTS: Record<string, DiseaseInsight> = {
  "Healthy Leaf": {
    explanation: "The leaf appears healthy with no visible signs of disease. The plant is in good condition with normal chlorophyll levels and cell structure.",
    causes: [],
    yieldImpact: "No yield impact expected. The crop is on track for normal harvest potential.",
    prevention: ["Maintain regular watering schedule", "Ensure balanced nutrient supply", "Monitor for early signs of stress", "Rotate crops seasonally"],
  },
  "Invalid Image": {
    explanation:
      "The model is not confident this photo contains a clear leaf. This usually happens with blurry images, non-leaf objects, very dark lighting, or the leaf being too small in the frame.",
    causes: ["Leaf not visible or too small", "Blur / motion", "Poor lighting or heavy shadows", "Background dominates the image"],
    yieldImpact: "No recommendation can be made until a valid leaf image is provided.",
    prevention: ["Take a close-up of a single leaf", "Use good daylight lighting", "Keep a plain background behind the leaf", "Ensure the leaf fills most of the frame"],
  },
  "Leaf Spot": {
    explanation: "Leaf spot diseases are caused by various fungal or bacterial pathogens that create localized necrotic lesions on the leaf surface, reducing the plant's photosynthetic capacity.",
    causes: ["Fungal pathogens (Cercospora, Septoria, Alternaria)", "Bacterial infections", "High humidity and prolonged leaf wetness", "Poor air circulation between plants"],
    yieldImpact: "Moderate yield reduction of 10–25% if untreated. Severe infections can cause premature defoliation.",
    prevention: ["Apply copper-based or chlorothalonil fungicide", "Remove and destroy infected leaves promptly", "Water at the base — avoid wetting foliage", "Ensure adequate plant spacing for airflow"],
  },
  "Rust Disease": {
    explanation: "Rust is a severe fungal disease characterized by orange-brown pustules on leaf surfaces. The fungal spores spread rapidly through wind and can devastate entire crops within weeks.",
    causes: ["Fungal spores (Puccinia species)", "Cool, moist weather conditions (15–25°C)", "Wind-borne spore dispersal", "Excess nitrogen fertilization"],
    yieldImpact: "High yield loss of 20–40% or more. Severe rust can cause complete crop failure if left unchecked.",
    prevention: ["Apply tebuconazole or azoxystrobin fungicide within 3 days", "Remove and burn infected plant parts", "Avoid excess nitrogen; use balanced fertilizer", "Plant resistant crop varieties when available"],
  },
  "Powdery Mildew": {
    explanation: "Powdery mildew appears as white powdery patches on leaf surfaces. It thrives in warm, dry conditions with high humidity and restricts nutrient uptake and photosynthesis.",
    causes: ["Fungal pathogen (Erysiphales order)", "Warm days and cool nights", "High humidity with poor air circulation", "Dense planting and shaded areas"],
    yieldImpact: "Moderate yield reduction of 10–20%. Fruit quality may also be reduced with cosmetic damage.",
    prevention: ["Apply sulfur-based fungicide or neem oil spray", "Improve air circulation around plants", "Avoid overhead watering; water at soil level", "Remove severely affected leaves and destroy them"],
  },
  "Uncertain Leaf Condition": {
    explanation: "The model confidence is below the threshold. The image may be blurry, poorly lit, or not clearly showing a leaf. Try uploading a clearer, well-lit photo of a single leaf.",
    causes: ["Image quality too low for accurate analysis", "Leaf not clearly visible in frame", "Unusual disease not in training dataset"],
    yieldImpact: "Cannot determine yield impact without a confident diagnosis.",
    prevention: ["Take a close-up photo with good lighting", "Ensure the leaf fills most of the frame", "Use a plain background behind the leaf", "Try scanning from a different angle"],
  },
};

type TreatmentDetail = {
  fungicide: string;
  preventive: string[];
  practices: string[];
};

const TREATMENT_DETAILS: Record<string, TreatmentDetail> = {
  "Healthy Leaf": {
    fungicide: "None required",
    preventive: ["Continue regular monitoring", "Maintain current care practices"],
    practices: ["Balanced fertilization", "Proper irrigation schedule", "Crop rotation"],
  },
  "Invalid Image": {
    fungicide: "Not applicable",
    preventive: ["Upload a clear leaf image", "Use good lighting and a plain background"],
    practices: ["Hold camera steady", "Focus on one leaf", "Avoid zoom blur; move closer instead"],
  },
  "Leaf Spot": {
    fungicide: "Copper hydroxide, Chlorothalonil, or Mancozeb",
    preventive: ["Remove infected leaves immediately", "Avoid overhead irrigation", "Space plants for airflow"],
    practices: ["Apply fungicide every 7–10 days during wet weather", "Use drip irrigation", "Mulch to prevent splash-borne spores"],
  },
  "Rust Disease": {
    fungicide: "Tebuconazole, Azoxystrobin, or Propiconazole",
    preventive: ["Remove and destroy infected plant parts", "Avoid excess nitrogen", "Monitor weather for rust-favorable conditions"],
    practices: ["Apply systemic fungicide within 3 days of detection", "Use resistant cultivars", "Ensure good field drainage"],
  },
  "Powdery Mildew": {
    fungicide: "Sulfur-based spray, Neem oil, or Potassium bicarbonate",
    preventive: ["Improve air circulation", "Avoid dense planting", "Water at the base of plants"],
    practices: ["Prune affected leaves and destroy them", "Apply fungicide early morning or evening", "Consider biological controls (Bacillus subtilis)"],
  },
  "Uncertain Leaf Condition": {
    fungicide: "Upload a clearer image for diagnosis",
    preventive: ["Take photo in good lighting", "Ensure leaf fills the frame"],
    practices: ["Use a plain background", "Try both front and back of leaf"],
  },
};

const PIPELINE_STEPS = [
  "Uploading image",
  "Preprocessing leaf image",
  "Validating leaf image",
  "Running CNN inference",
  "Generating prediction",
] as const;

let mobilenetPromise: Promise<import("@tensorflow-models/mobilenet").MobileNet> | null = null;
async function getMobileNet(): Promise<import("@tensorflow-models/mobilenet").MobileNet> {
  if (!mobilenetPromise) {
    mobilenetPromise = (async () => {
      const mnet: MobileNetModule = await import("@tensorflow-models/mobilenet");
      // v2 is more accurate; alpha 0.75 is a good speed/quality tradeoff.
      return mnet.load({ version: 2, alpha: 0.75 });
    })();
  }
  return mobilenetPromise;
}

function looksLikeLeaf(labels: string[]): boolean {
  const joined = labels.join(" ").toLowerCase();
  // Broad keyword gate for demo: plant/leaf/tree/flower/grass/vegetation.
  return (
    joined.includes("leaf") ||
    joined.includes("plant") ||
    joined.includes("tree") ||
    joined.includes("flower") ||
    joined.includes("grass") ||
    joined.includes("vegetable") ||
    joined.includes("cabbage") ||
    joined.includes("lettuce") ||
    joined.includes("tomato") ||
    joined.includes("potato") ||
    joined.includes("pepper") ||
    joined.includes("vegetation") ||
    joined.includes("herb") ||
    joined.includes("foliage")
  );
}

/** Grad-CAM: find last Conv2D layer in a loaded Layers model. */
function findLastConvLayer(
  model: import("@tensorflow/tfjs").LayersModel
): (typeof model.layers)[number] | null {
  const layers = model.layers;
  for (let i = layers.length - 1; i >= 0; i--) {
    const name = (layers[i] as { getClassName?: () => string }).getClassName?.() ?? "";
    if (name.includes("Conv2D") || name.includes("conv2d")) return layers[i]!;
  }
  return null;
}

/** Build models for Grad-CAM: [convOut, logits] and convOut -> logits. */
function buildGradCAMModels(
  tf: TF,
  model: import("@tensorflow/tfjs").LayersModel
): { gradModel: import("@tensorflow/tfjs").LayersModel; midModel: import("@tensorflow/tfjs").LayersModel } | null {
  const lastConv = findLastConvLayer(model);
  if (!lastConv || !model.inputs[0] || !model.output) return null;
  try {
    const gradModel = tf.model({
      inputs: model.inputs[0],
      outputs: [lastConv.output as import("@tensorflow/tfjs").SymbolicTensor, model.output as import("@tensorflow/tfjs").SymbolicTensor],
    }) as import("@tensorflow/tfjs").LayersModel;
    const midModel = tf.model({
      inputs: lastConv.output as import("@tensorflow/tfjs").SymbolicTensor,
      outputs: model.output as import("@tensorflow/tfjs").SymbolicTensor,
    }) as import("@tensorflow/tfjs").LayersModel;
    return { gradModel, midModel };
  } catch {
    return null;
  }
}

/**
 * Compute Grad-CAM heatmap and return a data URL of the leaf image with red/yellow overlay.
 * Uses: gradients of predicted class w.r.t. last conv, GAP, weight feature maps, ReLU, normalize, overlay.
 */
async function computeGradCAMOverlay(
  tf: TF,
  midModel: import("@tensorflow/tfjs").LayersModel,
  convOut: import("@tensorflow/tfjs").Tensor,
  predictedClassIndex: number,
  imgOrCanvas: HTMLImageElement | HTMLCanvasElement
): Promise<string | null> {
  const toDispose: import("@tensorflow/tfjs").Tensor[] = [];
  try {
    // Grad-CAM: gradients = d(classScore)/d(featureMaps); weights = globalAveragePool(gradients); heatmap = ReLU(sum(weights * featureMaps))
    const gradFn = tf.grad(
      (x: import("@tensorflow/tfjs").Tensor) =>
        (midModel.predict(x) as import("@tensorflow/tfjs").Tensor)
          .gather(0)
          .gather(predictedClassIndex)
    );
    const grads = gradFn(convOut);
    toDispose.push(grads);
    const weights = grads.mean([1, 2]);
    toDispose.push(weights);
    const heatmap = convOut.mul(weights).sum(-1).relu();
    toDispose.push(heatmap);
    const heatmapSqueezed = heatmap.squeeze([0]);
    toDispose.push(heatmapSqueezed);
    const minVal = heatmapSqueezed.min();
    const maxVal = heatmapSqueezed.max();
    toDispose.push(minVal, maxVal);
    const heatmapNorm = heatmapSqueezed.sub(minVal).div(maxVal.sub(minVal).maximum(1e-7));
    toDispose.push(heatmapNorm);
    const targetW = "naturalWidth" in imgOrCanvas ? imgOrCanvas.naturalWidth : imgOrCanvas.width;
    const targetH = "naturalHeight" in imgOrCanvas ? imgOrCanvas.naturalHeight : imgOrCanvas.height;
    const heatmap4d = heatmapNorm.expandDims(0).expandDims(-1) as import("@tensorflow/tfjs").Tensor4D;
    toDispose.push(heatmap4d);
    const heatmapResized = tf.image.resizeBilinear(heatmap4d, [targetH, targetW]);
    toDispose.push(heatmapResized);
    const heatmapData = await heatmapResized.squeeze([0, 3]).data();
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imgOrCanvas, 0, 0);
    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = targetW;
    overlayCanvas.height = targetH;
    const octx = overlayCanvas.getContext("2d");
    if (!octx) return null;
    const imageData = octx.createImageData(targetW, targetH);
    const data = imageData.data;
    // Overlay: leaf image + rgba(255,0,0,0.5) heatmap (red, 0.5 max alpha; intensity scales alpha)
    for (let i = 0; i < targetW * targetH; i++) {
      const v = Math.max(0, Math.min(1, heatmapData[i] ?? 0));
      data[i * 4] = 255;     // R
      data[i * 4 + 1] = 0;   // G
      data[i * 4 + 2] = 0;   // B
      data[i * 4 + 3] = Math.round(255 * 0.5 * v);
    }
    octx.putImageData(imageData, 0, 0);
    ctx.drawImage(overlayCanvas, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    tf.dispose(toDispose);
  }
}

const SEVERITY_LEVELS = ["No Risk", "Low Risk", "Moderate Risk", "High Risk"] as const;
type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

/** Severity by disease (used for both real and fallback results). */
function severityForDisease(diseaseName: string): SeverityLevel {
  switch (diseaseName) {
    case "Healthy Leaf":
      return "No Risk";
    case "Invalid Image":
      return "Low Risk";
    case "Leaf Spot":
      return "Moderate Risk";
    case "Rust Disease":
      return "High Risk";
    case "Powdery Mildew":
      return "Moderate Risk";
    case "Uncertain Leaf Condition":
      return "Low Risk";
    default:
      return ["Low Risk", "Moderate Risk", "High Risk"][Math.floor(Math.random() * 3)] as SeverityLevel;
  }
}

export type PredictionResult = (typeof DISEASES)[number] & {
  confidence: number;
  severity: SeverityLevel;
  analysisTimeSec: number;
  warning?: string;
  topPredictions?: { label: string; probability: number }[];
  inferenceTimeMs?: number;
  gradCamTimeMs?: number;
};

/** Fallback when TensorFlow.js model is unavailable or inference fails. */
function simulateDetection(): PredictionResult {
  const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)]!;
  const confidence = Math.round((85 + Math.random() * 14) * 10) / 10;
  const severity = severityForDisease(disease.name);
  const analysisTimeSec = Math.round((12 + Math.random() * 13)) / 10;
  return { ...disease, confidence, severity, analysisTimeSec, topPredictions: [] };
}

/** Input mode: upload a photo or scan with camera. */
type InputMode = "upload" | "camera";

const REAL_TIME_SCAN_INTERVAL_MS = 2500;

/** Real-time camera scanner: live video, capture frame to canvas, parent converts canvas to tensor and runs model. */
function LeafScanner({
  onCapture,
  disabled,
  realTimeScan,
  isDetecting,
}: {
  onCapture: (canvas: HTMLCanvasElement) => void;
  disabled?: boolean;
  realTimeScan?: boolean;
  isDetecting?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      setIsRequesting(false);
      return;
    }
    let cancelled = false;
    // Camera stream: getUserMedia({ video: true }) → video.srcObject = stream
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraError(null);
        setIsRequesting(false);
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setIsRequesting(false);
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setCameraError("Camera access was denied. Please allow camera permission to scan leaves.");
          } else if (err.name === "NotFoundError") {
            setCameraError("No camera found on this device.");
          } else {
            setCameraError(err.message || "Could not access camera.");
          }
        }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current || video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // canvas.drawImage(video, 0, 0, width, height) → then parent: fromPixels(canvas) → resize → predict
    ctx.drawImage(video, 0, 0, w, h);
    onCapture(canvas);
  }, [onCapture]);

  // Real-time scan: capture → model.predict → update result on an interval (skip when still detecting)
  useEffect(() => {
    if (!realTimeScan || disabled || isRequesting || isDetecting) return;
    const id = setInterval(() => {
      if (!isDetecting) handleCapture();
    }, REAL_TIME_SCAN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [realTimeScan, disabled, isRequesting, isDetecting, handleCapture]);

  if (cameraError) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-6 text-center">
          <p className="text-sm font-medium text-red-200">{cameraError}</p>
          <p className="mt-2 text-xs text-gray-400">
            You can switch to &quot;Upload Image&quot; to analyze a photo instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-400">Camera feed</p>
      <div className="relative aspect-4/3 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          aria-label="Live camera feed"
        />
        {/* Guide overlay: place leaf inside the frame */}
        {!isRequesting && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
            aria-hidden
          >
            <div className="rounded-lg border-2 border-dashed border-white/50 bg-black/30 px-4 py-2 backdrop-blur-sm">
              <p className="text-center text-sm font-medium text-white opacity-95">Place leaf inside the frame</p>
            </div>
            <div className="absolute inset-[12%] rounded-2xl border-2 border-dashed border-[#00FF9C]/40" />
          </div>
        )}
        {isRequesting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-10 w-10 animate-spin text-[#00FF9C]" />
            <span className="sr-only">Starting camera…</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <motion.button
        type="button"
        onClick={handleCapture}
        disabled={disabled || isRequesting}
        className="btn-glow-primary w-full rounded-xl bg-[#00FF9C] py-4 font-display text-lg font-semibold text-[#0A0F1F] transition-all hover:bg-[#00e08a] disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={disabled || isRequesting ? undefined : { scale: 1.02 }}
        whileTap={disabled || isRequesting ? undefined : { scale: 0.98 }}
      >
        Capture Leaf Image
      </motion.button>
    </div>
  );
}

function severityStyle(severity: SeverityLevel): { bg: string; text: string; border: string } {
  switch (severity) {
    case "No Risk":
    case "Low Risk":
      return { bg: "bg-[#00FF9C]/15", text: "text-[#00FF9C]", border: "border-[#00FF9C]/40" };
    case "Moderate Risk":
      return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/40" };
    case "High Risk":
      return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/40" };
  }
}

/** Trust indicator: label + color-coded badge classes from confidence %. */
function confidenceTrust(confidence: number): { label: string; badge: string } {
  if (confidence > 80) return { label: "High Confidence ✅", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" };
  if (confidence >= 60) return { label: "Moderate Confidence ⚠", badge: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
  return { label: "Low Confidence ❌", badge: "bg-rose-500/15 text-rose-300 border-rose-500/40" };
}

export default function DiseaseDetectionPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [model, setModel] = useState<Awaited<ReturnType<TF["loadLayersModel"]>> | null>(null);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string | null>(null);
  const [resultImageView, setResultImageView] = useState<"original" | "heatmap">("original");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [realTimeScan, setRealTimeScan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gradCAMModelsRef = useRef<{
    gradModel: import("@tensorflow/tfjs").LayersModel;
    midModel: import("@tensorflow/tfjs").LayersModel;
  } | null>(null);
  const classNamesRef = useRef<string[]>(PLANTVILLAGE_38_FALLBACK);

  // Load class names from /model/class_names.json so labels match trained model output order
  useEffect(() => {
    fetch("/model/class_names.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Not found"))))
      .then((names: unknown) => {
        if (Array.isArray(names) && names.length >= 38) {
          const filtered = names.filter((n): n is string => typeof n === "string");
          if (filtered.length === 39 && filtered[38] === "raw") classNamesRef.current = filtered.slice(0, 38);
          else classNamesRef.current = filtered.length === 38 ? filtered : filtered.slice(0, 38);
        }
      })
      .catch(() => {
        classNamesRef.current = PLANTVILLAGE_38_FALLBACK;
      });
  }, []);

  // Load TensorFlow.js model once when the component initializes
  useEffect(() => {
    let cancelled = false;
    console.log("Loading TensorFlow model...");
    import("@tensorflow/tfjs")
      .then((tf) => tf.loadLayersModel("/model/model.json").then((m) => ({ tf, m })))
      .then(({ tf, m }) => {
        if (cancelled) return;
        const inputShape = m.inputs[0]?.shape;
        const isImageModel =
          inputShape &&
          inputShape.length === 4 &&
          (inputShape[1] === 224 || inputShape[1] === null) &&
          (inputShape[2] === 224 || inputShape[2] === null) &&
          (inputShape[3] === 3 || inputShape[3] === null);
        if (!isImageModel) {
          setModelLoadError(true);
          console.error("TensorFlow model input shape invalid. Expected [batch, 224, 224, 3], got:", inputShape);
          return;
        }
        setModel(m);
        setModelLoadError(false);
        const built = buildGradCAMModels(tf, m);
        if (built) gradCAMModelsRef.current = built;
        const warmUpInput = tf.zeros([1, 224, 224, 3]);
        const warmUpOut = m.predict(warmUpInput);
        const toDispose = Array.isArray(warmUpOut) ? [warmUpInput, ...warmUpOut] : [warmUpInput, warmUpOut];
        tf.dispose(toDispose);
        console.log("TensorFlow model loaded successfully");
      })
      .catch((err) => {
        if (!cancelled) {
          setModelLoadError(true);
          console.error("TensorFlow model failed to load from /model/model.json:", err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setFileName(file.name);
    setResult(null);
    setInferenceError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDetect = useCallback(async (overrideUrl?: string, captureCanvas?: HTMLCanvasElement) => {
    const url = overrideUrl ?? imagePreview;
    if (!url && !captureCanvas) return;
    setResult(null);
    setInferenceError(null);
    setHeatmapDataUrl(null);
    setResultImageView("original");
    setIsDetecting(true);
    setPipelineStep(1);
    const startTime = performance.now();
    const m = model;
    if (!m || modelLoadError) {
      setIsDetecting(false);
      setPipelineStep(0);
      return;
    }
    const tf = await import("@tensorflow/tfjs");
    const gradModels = gradCAMModelsRef.current;
    try {
      await new Promise((r) => setTimeout(r, 200));
      setPipelineStep(2);
      let imageTensor: import("@tensorflow/tfjs").Tensor;
      let imgOrCanvas: HTMLImageElement | HTMLCanvasElement;
      if (captureCanvas) {
        // Camera path: tensor = fromPixels(canvas).resizeNearestNeighbor([224,224]).toFloat().div(255).expandDims(0); then model.predict(tensor)
        imageTensor = tf.image
          .resizeNearestNeighbor(tf.browser.fromPixels(captureCanvas) as import("@tensorflow/tfjs").Tensor3D, [224, 224])
          .toFloat()
          .div(255)
          .expandDims(0);
        imgOrCanvas = captureCanvas;
      } else {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          if (!url!.startsWith("blob:")) i.crossOrigin = "anonymous";
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("Failed to load image"));
          i.src = url!;
        });
        imageTensor = tf.image.resizeNearestNeighbor(
          tf.browser.fromPixels(img) as import("@tensorflow/tfjs").Tensor3D,
          [224, 224]
        );
        imageTensor = imageTensor.toFloat().div(255).expandDims(0);
        imgOrCanvas = img;
      }
      await new Promise((r) => setTimeout(r, 100));

      // Step: validate leaf vs non-leaf (lightweight gate)
      setPipelineStep(3);
      try {
        const mnet = await getMobileNet();
        const preds = await mnet.classify(imgOrCanvas as any, 5);
        const topLabels = preds.map((p) => p.className);
        const topConf = preds[0]?.probability ?? 0;
        const isLeafLike = looksLikeLeaf(topLabels);
        // Reject if MobileNet doesn't see plant/leaf/tree-like content.
        // Also reject if top confidence is extremely low (likely noise / wrong object).
        // Soft gate: only reject when MobileNet is confident it's NON-leaf-like.
        if (!isLeafLike && topConf >= 0.35) {
          const invalid = DISEASES.find((d) => d.name === "Invalid Image")!;
          const analysisTimeSec = Math.round((performance.now() - startTime) / 100) / 10;
          tf.dispose([imageTensor]);
          setHeatmapDataUrl(null);
          setResult({
            ...invalid,
            confidence: Math.round(topConf * 1000) / 10,
            severity: severityForDisease(invalid.name),
            analysisTimeSec,
            topPredictions: topLabels.slice(0, 3).map((l, idx) => ({
              label: l,
              probability: Math.round((preds[idx]?.probability ?? 0) * 1000) / 10,
            })),
          });
          return;
        }
      } catch (e) {
        // If MobileNet fails to load (offline etc.), don't block disease detection.
        console.warn("Leaf validation skipped:", e);
      }

      const inferenceStart = performance.now();
      let out: import("@tensorflow/tfjs").Tensor;
      let convOut: import("@tensorflow/tfjs").Tensor | null = null;
      if (gradModels) {
        const outputs = gradModels.gradModel.predict(imageTensor) as import("@tensorflow/tfjs").Tensor[];
        convOut = outputs[0] ?? null;
        out = outputs[1]!;
      } else {
        const prediction = m.predict(imageTensor) as import("@tensorflow/tfjs").Tensor;
        out = Array.isArray(prediction) ? prediction[0]! : prediction;
      }
      setPipelineStep(4);
      const probabilities = await out.data();
      const inferenceTimeMs = performance.now() - inferenceStart;
      console.log("Prediction probabilities:", probabilities);
      const probArr: number[] = Array.from(probabilities as Float32Array);
      const classNames = classNamesRef.current;
      const numClasses = classNames.length;
      if (probArr.length < 38) {
        setInferenceError(
          `Model output has ${probArr.length} classes. Expected 38 (PlantVillage). Ensure /public/model/ contains the converted plant_disease_model.`
        );
        return;
      }
      const indexed = probArr.map((p, i) => ({ i, p }));
      indexed.sort((a, b) => b.p - a.p);
      const maxIdx = indexed[0]?.i ?? 0;
      const maxProb = indexed[0]?.p ?? 0;
      const confidence = Math.round(maxProb * 1000) / 10;
      const predictedClass = numClasses > 0 && classNames[maxIdx]
        ? classNames[maxIdx]!
        : LABELS[Math.min(maxIdx, LABELS.length - 1)]!;
      console.log("Predicted class:", predictedClass);
      console.log("Top probabilities:", probArr.slice().sort((a, b) => b - a).slice(0, 5));
      const LOW_CONFIDENCE_WARNING_THRESHOLD = 0.4;
      const UNCERTAIN_TOP2_GAP = 0.1;
      const top2Gap =
        typeof indexed[1]?.p === "number" ? Math.abs((indexed[0]?.p ?? 0) - indexed[1]!.p) : 1;

      const warning =
        maxProb < LOW_CONFIDENCE_WARNING_THRESHOLD ? "Low confidence prediction" : undefined;

      const disease = (() => {
        // 1) If top predictions are too close, mark as uncertain
        if (top2Gap < UNCERTAIN_TOP2_GAP) {
          return DISEASES.find((d) => d.name === "Uncertain Leaf Condition")!;
        }

        // 2) Normal mapping (even if confidence is low; we show a warning instead)
        const diseaseName =
          numClasses > 0 && classNames[maxIdx]
            ? plantVillageToLabel(classNames[maxIdx]!)
            : (LABELS[Math.min(maxIdx, LABELS.length - 1)]! as (typeof LABELS)[number]);
        return DISEASES.find((d) => d.name === diseaseName) ?? DISEASES[0]!;
      })();
      const analysisTimeSec = Math.round((performance.now() - startTime) / 100) / 10;
      const getRawLabel = (idx: number) =>
        numClasses > 0 && classNames[idx]
          ? classNames[idx]!.replace(/___/g, " — ").replace(/_/g, " ")
          : LABELS[Math.min(idx, LABELS.length - 1)]!;
      const top3 = indexed.slice(0, 3).map(({ i, p }) => ({
        label: getRawLabel(i),
        probability: Math.round(p * 1000) / 10,
      }));
      let gradCamTimeMs: number | undefined;
      if (convOut != null && gradModels?.midModel) {
        try {
          const gradCamStart = performance.now();
          const overlayUrl = await computeGradCAMOverlay(
            tf,
            gradModels.midModel,
            convOut,
            maxIdx,
            imgOrCanvas
          );
          gradCamTimeMs = performance.now() - gradCamStart;
          if (overlayUrl) setHeatmapDataUrl(overlayUrl);
        } catch (e) {
          console.warn("Grad-CAM overlay failed:", e);
        }
      }
      tf.dispose([imageTensor, out].concat(convOut ? [convOut] : []));
      setResult({
        ...disease,
        confidence: Math.min(100, Math.max(0, confidence)),
        severity: severityForDisease(disease.name),
        analysisTimeSec,
        warning,
        topPredictions: top3,
        inferenceTimeMs,
        gradCamTimeMs,
      });
    } catch (err) {
      console.error("Inference failed:", err);
      setInferenceError(
        "Prediction failed. Ensure /public/model/ contains model.json and shard files (PlantVillage CNN, input [1,224,224,3], 38 classes)."
      );
    } finally {
      setIsDetecting(false);
      setPipelineStep(0);
    }
  }, [imagePreview, model, modelLoadError]);

  const handleReset = () => {
    setImagePreview(null);
    setFileName(null);
    setResult(null);
    setHeatmapDataUrl(null);
    setResultImageView("original");
    setRealTimeScan(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCameraCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      setImagePreview(canvas.toDataURL("image/jpeg"));
      setFileName("Camera capture");
      handleDetect(undefined, canvas);
    },
    [handleDetect]
  );

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display flex items-center gap-2 text-sm font-semibold text-[#00C3FF] transition-colors hover:text-[#00FF9C]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <span className="font-display text-lg font-bold text-white">
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AI Crop <span className="text-gradient">Health Analysis</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Upload a crop leaf image and let AI detect possible diseases.
          </p>
        </motion.div>

        {modelLoadError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300"
          >
            TensorFlow model not found in /public/model/. Place a CNN model (input [batch, 224, 224, 3], 4 classes) in public/model/ or the current model is not compatible.
          </motion.div>
        )}
        {inferenceError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-200"
          >
            {inferenceError}
          </motion.div>
        )}

        {/* Main glassmorphism card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card neon-border overflow-hidden rounded-2xl p-6 transition-all duration-300 sm:p-8"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="leaf-upload"
          />

          {/* Toggle: Switch Camera / Upload Image */}
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setInputMode((m) => (m === "upload" ? "camera" : "upload"));
                if (inputMode === "camera") setRealTimeScan(false);
              }}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-[#00FF9C]/40 hover:bg-white/10 hover:text-white"
            >
              <Camera className="h-4 w-4" />
              {inputMode === "upload" ? "Switch to Camera" : "Switch to Upload Image"}
            </button>
          </div>

          {inputMode === "camera" ? (
            <>
              <LeafScanner
                onCapture={handleCameraCapture}
                disabled={modelLoadError}
                realTimeScan={realTimeScan}
                isDetecting={isDetecting}
              />
              {/* Real-Time Scan Mode: camera frame → model.predict → update result */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="realtime-scan"
                  checked={realTimeScan}
                  onChange={(e) => setRealTimeScan(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#00FF9C]"
                />
                <label htmlFor="realtime-scan" className="text-sm text-gray-400">
                  Real-time scan (updates every ~2.5s)
                </label>
              </div>
              {/* Compact layout: Prediction + Heatmap when result exists */}
              {result && (
                <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                  <p className="text-sm font-medium text-gray-400">Prediction:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-bold text-white">
                      {result.name}
                      <span className="ml-2 font-semibold" style={{ color: result.color }}>
                        — {result.confidence}%
                      </span>
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${confidenceTrust(result.confidence).badge}`}
                    >
                      {confidenceTrust(result.confidence).label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Higher confidence means more reliable prediction.</p>
                  <p className="text-xs text-gray-500">
                    Note: This AI model works best with clear images of plant leaves. Results may vary for unclear or non-standard images.
                  </p>
                  {result.name !== "Invalid Image" && heatmapDataUrl != null && imagePreview && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-300">
                          {resultImageView === "original" ? "Original" : "Heatmap Overlay"}
                        </p>
                        <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
                          <button
                            type="button"
                            onClick={() => setResultImageView("original")}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              resultImageView === "original" ? "bg-[#00FF9C]/20 text-[#00FF9C]" : "text-gray-400"
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={() => setResultImageView("heatmap")}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              resultImageView === "heatmap" ? "bg-[#00FF9C]/20 text-[#00FF9C]" : "text-gray-400"
                            }`}
                          >
                            Heatmap
                          </button>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-white/10">
                        <img
                          src={resultImageView === "heatmap" ? heatmapDataUrl : imagePreview}
                          alt={resultImageView === "heatmap" ? "Heatmap Overlay" : "Captured leaf"}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
          {/* 1. Image Upload – drag and drop or upload button */}
          {!imagePreview ? (
            <>
            <label
              htmlFor="leaf-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-all duration-300 ${
                isDragging
                  ? "border-[#00FF9C] bg-[#00FF9C]/15"
                  : "border-[#00FF9C]/40 bg-[#00FF9C]/5 hover:border-[#00FF9C]/60 hover:bg-[#00FF9C]/10"
              }`}
            >
              <Upload className="mb-4 h-14 w-14 text-[#00FF9C]" />
              <span className="mb-1 font-semibold text-white">
                {isDragging ? "Drop image here" : "Drag and drop or click to upload"}
              </span>
              <span className="text-sm text-gray-400">PNG, JPG up to 10MB</span>
            </label>
            {/* Try Demo Image */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
                <ImageIcon className="h-4 w-4 text-[#00FF9C]" />
                Try Demo Image
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_LEAF_IMAGES.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => {
                      setImagePreview(demo.src);
                      setFileName(demo.label);
                      setResult(null);
                      setInferenceError(null);
                    }}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-[#00FF9C]/40 hover:bg-[#00FF9C]/10 hover:text-[#00FF9C]"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-600">Click a label to load a sample leaf and test the AI model instantly.</p>
            </div>
            </>
          ) : (
            <>
              {/* 2. Image Preview */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-400">Image Preview</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <img
                    src={imagePreview}
                    alt="Uploaded leaf"
                    className="h-full w-full object-contain"
                  />
                  {/* Bounding box overlay when analysis completes */}
                  <AnimatePresence>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <svg
                          className="absolute inset-0 h-full w-full"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <defs>
                            <filter id="box-glow">
                              <feGaussianBlur stdDeviation="0.5" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <motion.rect
                            x={18}
                            y={14}
                            width={64}
                            height={72}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.2"
                            filter="url(#box-glow)"
                            style={{
                              strokeDasharray: 272,
                            }}
                            initial={{ strokeDashoffset: 272 }}
                            animate={{
                              strokeDashoffset: 0,
                              opacity: [1, 0.7, 1],
                              strokeWidth: [1.2, 1.8, 1.2],
                            }}
                            transition={{
                              strokeDashoffset: {
                                duration: 1.4,
                                ease: [0.22, 1, 0.36, 1],
                                delay: 0.2,
                              },
                              opacity: {
                                duration: 1.2,
                                repeat: Infinity,
                                repeatDelay: 0.2,
                                ease: "easeInOut",
                              },
                              strokeWidth: {
                                duration: 1.2,
                                repeat: Infinity,
                                repeatDelay: 0.2,
                                ease: "easeInOut",
                              },
                            }}
                          />
                        </svg>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 1,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="absolute left-[18%] top-[10%] -translate-y-full rounded-md border border-red-500/80 bg-red-500/20 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
                        >
                          <span className="text-xs font-bold text-red-200 drop-shadow-sm">
                            {result.name}
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label
                    htmlFor="leaf-upload"
                    className="cursor-pointer rounded-full border-2 border-[#00C3FF] px-5 py-2.5 text-sm font-semibold text-[#00C3FF] transition-all hover:bg-[#00C3FF]/10"
                  >
                    Change image
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-white/40 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* 3. Detect Disease Button – "Analyze Crop" with glowing green hover */}
              {!isDetecting && (
                <motion.div
                  className="mt-8 flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.button
                    onClick={() => handleDetect()}
                    disabled={modelLoadError}
                    className="btn-glow-primary w-full rounded-xl bg-[#00FF9C] py-4 font-display text-lg font-semibold text-[#0A0F1F] transition-all hover:bg-[#00e08a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-12"
                    whileHover={modelLoadError ? undefined : { scale: 1.02 }}
                    whileTap={modelLoadError ? undefined : { scale: 0.98 }}
                  >
                    {result ? "Analyze again" : "Analyze Crop"}
                  </motion.button>
                </motion.div>
              )}

              {/* 4. AI Pipeline – step-by-step with loading animation */}
              <AnimatePresence mode="wait">
                {isDetecting && (
                  <motion.div
                    key="pipeline"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-8 rounded-xl border border-[#00FF9C]/25 bg-[#00FF9C]/5 p-6 backdrop-blur-sm"
                  >
                    <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-[#00FF9C]/80">
                      AI pipeline
                    </p>
                    <ul className="space-y-1">
                      {PIPELINE_STEPS.map((label, index) => {
                        const stepNum = index + 1;
                        const isActive = pipelineStep === stepNum;
                        const isDone = pipelineStep > stepNum;
                        return (
                          <motion.li
                            key={label}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay: index * 0.05,
                              duration: 0.3,
                            }}
                            className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-300 ${
                              isActive
                                ? "bg-[#00FF9C]/15 ring-1 ring-[#00FF9C]/40"
                                : isDone
                                  ? "bg-white/5"
                                  : "bg-transparent opacity-60"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                              {isDone ? (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                  <Check className="h-5 w-5 text-[#00FF9C]" />
                                </motion.span>
                              ) : isActive ? (
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                >
                                  <Loader2 className="h-5 w-5 text-[#00FF9C]" />
                                </motion.span>
                              ) : (
                                <span className="font-mono text-sm text-gray-500">
                                  {stepNum}
                                </span>
                              )}
                            </span>
                            <span
                              className={`font-medium ${
                                isActive ? "text-white" : isDone ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {label}
                            </span>
                            {isActive && (
                              <motion.div
                                className="ml-auto h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-white/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <motion.div
                                  className="h-full rounded-full bg-[#00FF9C]"
                                  initial={{ width: "0%" }}
                                  animate={{
                                    width: ["0%", "100%"],
                                  }}
                                  transition={{
                                    duration: 0.7,
                                    repeat: Infinity,
                                    repeatDelay: 0.1,
                                  }}
                                />
                              </motion.div>
                            )}
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
            </>
          )}
        </motion.div>

        {/* Result card – status label + card */}
        <AnimatePresence mode="wait">
          {result && (
            <>
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-[#00FF9C]/30 bg-[#00FF9C]/5 py-2.5 px-4"
              >
                <motion.span
                  animate={{
                    boxShadow: [
                      "0 0 12px rgba(0, 255, 156, 0.35)",
                      "0 0 20px rgba(0, 255, 156, 0.5)",
                      "0 0 12px rgba(0, 255, 156, 0.35)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#00FF9C]" />
                </motion.span>
                <span className="text-sm font-medium text-[#00FF9C]/90">
                  AI Model Status: Analysis Complete
                </span>
              </motion.div>
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card neon-border mt-4 overflow-hidden rounded-2xl p-6 transition-all duration-300 sm:p-8"
              >
              {result.name === "Invalid Image" && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.18)]"
                >
                  <div className="relative mt-0.5 shrink-0">
                    <span className="absolute -inset-1 rounded-full bg-rose-500/25 blur-md animate-pulse" />
                    <AlertCircle className="relative h-5 w-5 text-rose-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-rose-50">⚠ This image does not appear to be a plant leaf</p>
                    <p className="mt-0.5 text-sm text-rose-100/80">Upload a clear leaf image with good lighting.</p>
                  </div>
                </div>
              )}
              {result.name === "Uncertain Leaf Condition" && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-100"
                >
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="font-semibold text-amber-50">Uncertain result</p>
                    <p className="mt-0.5 text-sm text-amber-100/80">
                      Top predictions are too close. Try a clearer close-up leaf photo for a confident diagnosis.
                    </p>
                  </div>
                </div>
              )}
              {result.warning && result.name !== "Invalid Image" && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100"
                >
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="font-semibold text-amber-50">{result.warning}</p>
                    <p className="mt-0.5 text-sm text-amber-100/80">
                      Try a clearer close-up leaf image for a more reliable prediction.
                    </p>
                  </div>
                </div>
              )}
              <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${result.color}20` }}
                >
                  <result.icon className="h-6 w-6" style={{ color: result.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Detection result
                  </p>
                  <h2 className="font-display text-xl font-bold text-white">
                    {result.name}
                  </h2>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-white/5 px-4 py-3">
                  <span className="text-gray-400">Disease: </span>
                  <span className="font-semibold text-white">{result.name}</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Confidence Score
                  </p>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="font-display text-2xl font-bold tabular-nums"
                      style={{ color: result.color }}
                    >
                      {result.confidence}%
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${confidenceTrust(result.confidence).badge}`}
                    >
                      {confidenceTrust(result.confidence).label}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-[#00FF9C]"
                      style={{
                        boxShadow: "0 0 20px rgba(0, 255, 156, 0.6), 0 0 40px rgba(0, 255, 156, 0.3)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, result.confidence)}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.25,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Higher confidence means more reliable prediction.
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Note: This AI model works best with clear images of plant leaves. Results may vary for unclear or non-standard images.
                  </p>
                </div>
                {result.topPredictions && result.topPredictions.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
                    <p className="mb-3 text-sm font-medium text-gray-400">
                      Top 3 predictions
                    </p>
                    <ol className="space-y-2">
                      {result.topPredictions.map((item, rank) => (
                        <li
                          key={`${item.label}-${rank}`}
                          className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                        >
                          <span className="font-medium text-white">
                            {rank + 1}. {item.label}
                          </span>
                          <span className="font-display tabular-nums font-semibold text-[#00FF9C]">
                            {item.probability}%
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Disease Severity Indicator
                  </p>
                  <span className="text-gray-400">Severity: </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold ${severityStyle(result.severity).bg} ${severityStyle(result.severity).text} ${severityStyle(result.severity).border}`}
                  >
                    {result.severity}
                  </span>
                </div>
                {/* AI Crop Advisor Card */}
                {result.name !== "Invalid Image" && (
                <div className="rounded-xl border border-[#00C3FF]/30 bg-[#00C3FF]/5 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C3FF]/20">
                      <Sparkles className="h-4 w-4 text-[#00C3FF]" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#00C3FF]">AI Crop Advisor</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-300">Suggested Fungicide / Pesticide</p>
                        <p className="mt-0.5 text-gray-400">{TREATMENT_DETAILS[result.name]?.fungicide ?? result.treatment}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Bug className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-300">Preventive Steps</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-gray-400">
                          {(TREATMENT_DETAILS[result.name]?.preventive ?? [result.treatment]).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sun className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-300">Best Farming Practices</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-gray-400">
                          {(TREATMENT_DETAILS[result.name]?.practices ?? []).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* AI Insight Card */}
                {AI_INSIGHTS[result.name] && (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                        <Leaf className="h-4 w-4 text-amber-400" />
                      </div>
                      <h3 className="font-display text-sm font-bold text-amber-400">AI Insight</h3>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-gray-300">
                      {AI_INSIGHTS[result.name]!.explanation}
                    </p>
                    {AI_INSIGHTS[result.name]!.causes.length > 0 && (
                      <div className="mb-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <Droplets className="h-3 w-3" /> Possible Environmental Causes
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-gray-400">
                          {AI_INSIGHTS[result.name]!.causes.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Flame className="h-3 w-3" /> Potential Yield Impact
                      </p>
                      <p className="mt-1 text-sm text-gray-400">{AI_INSIGHTS[result.name]!.yieldImpact}</p>
                    </div>
                    {AI_INSIGHTS[result.name]!.prevention.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <Shield className="h-3 w-3" /> Suggested Prevention
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-gray-400">
                          {AI_INSIGHTS[result.name]!.prevention.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.name !== "Invalid Image" && heatmapDataUrl != null && imagePreview && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-300">
                        {resultImageView === "original"
                          ? "Original leaf image"
                          : "AI Attention Map (Grad-CAM)"}
                      </p>
                      <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5">
                        <button
                          type="button"
                          onClick={() => setResultImageView("original")}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            resultImageView === "original"
                              ? "bg-[#00FF9C]/20 text-[#00FF9C]"
                              : "text-gray-400 hover:text-gray-300"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() => setResultImageView("heatmap")}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            resultImageView === "heatmap"
                              ? "bg-[#00FF9C]/20 text-[#00FF9C]"
                              : "text-gray-400 hover:text-gray-300"
                          }`}
                        >
                          AI Attention Map
                        </button>
                      </div>
                    </div>
                    <div className="relative min-h-[200px] overflow-hidden rounded-lg border border-white/10">
                      <AnimatePresence mode="wait">
                        {resultImageView === "original" ? (
                          <motion.div
                            key="original"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="absolute inset-0"
                          >
                            <img
                              src={imagePreview}
                              alt="Original leaf"
                              className="h-auto w-full object-contain"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="heatmap"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="absolute inset-0"
                          >
                            <img
                              src={heatmapDataUrl}
                              alt="AI Attention Map (Grad-CAM)"
                              className="h-auto w-full object-contain"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="rounded-lg bg-black/20 px-4 py-3 font-mono">
                    <p className="text-xs text-gray-500">
                      Analysis Time: {result.analysisTimeSec} seconds
                    </p>
                    {result.inferenceTimeMs != null && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        CNN inference: {(result.inferenceTimeMs / 1000).toFixed(3)} s
                      </p>
                    )}
                    {result.gradCamTimeMs != null && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Grad-CAM heatmap: {(result.gradCamTimeMs / 1000).toFixed(3)} s
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      Model: MobileNetV2 CNN
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Framework: TensorFlow.js
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Dataset: PlantVillage (54K images)
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Classes: 38
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Inference: Client-side
                    </p>
                  </div>
                </div>
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
