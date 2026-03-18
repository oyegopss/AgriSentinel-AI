"use client";

/** CNN output class order: Healthy Leaf, Leaf Spot, Rust Disease, Powdery Mildew */
export const MODEL_CLASS_NAMES = [
  "Healthy Leaf",
  "Leaf Spot",
  "Rust Disease",
  "Powdery Mildew",
] as const;

export type CropPrediction = {
  diseaseName: (typeof MODEL_CLASS_NAMES)[number];
  confidence: number;
};

let cachedModel: import("@tensorflow/tfjs").LayersModel | null = null;

async function loadTfAndModel(): Promise<{
  tf: typeof import("@tensorflow/tfjs");
  model: import("@tensorflow/tfjs").LayersModel;
}> {
  const tf = await import("@tensorflow/tfjs");
  if (cachedModel) return { tf, model: cachedModel };
  const model = await tf.loadLayersModel("/model/model.json") as import("@tensorflow/tfjs").LayersModel;
  cachedModel = model;
  return { tf, model };
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

/**
 * Preprocess image for CNN: resize 224x224, normalize 0-1, batch dim.
 */
function preprocess(
  tf: typeof import("@tensorflow/tfjs"),
  img: HTMLImageElement
): import("@tensorflow/tfjs").Tensor {
  let tensor = tf.browser.fromPixels(img);
  tensor = tf.image.resizeBilinear(tensor, [224, 224]);
  tensor = tensor.div(255.0);
  tensor = tensor.expandDims(0);
  return tensor;
}

/**
 * Run CNN inference. Loads model once and caches.
 * Returns predicted class name and confidence (0-100).
 */
export async function runInference(imageUrl: string): Promise<CropPrediction> {
  const { tf, model } = await loadTfAndModel();
  const img = await loadImage(imageUrl);
  const inputTensor = preprocess(tf, img);
  const output = model.predict(inputTensor) as import("@tensorflow/tfjs").Tensor;
  const probs = Array.isArray(output) ? output[0] : output;
  const probArray = Array.from((await probs.data()) as Float32Array);
  tf.dispose([inputTensor, probs]);
  const maxIdx = probArray.indexOf(Math.max(...probArray));
  const confidence = Math.round(probArray[maxIdx]! * 1000) / 10;
  const diseaseName = MODEL_CLASS_NAMES[Math.min(maxIdx, MODEL_CLASS_NAMES.length - 1)]!;
  return { diseaseName, confidence: Math.min(100, Math.max(0, confidence)) };
}

/**
 * Load the model once (e.g. on page init). Call this to warm up the model.
 */
export async function ensureModelLoaded(): Promise<boolean> {
  try {
    await loadTfAndModel();
    return true;
  } catch {
    return false;
  }
}
