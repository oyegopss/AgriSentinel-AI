/**
 * Advanced Leaf Validation (Hard Gate System)
 * Checks for "Organic Agricultural Patterns" (Veins/Tissue) vs Synthetic surfaces (Walls/Paper).
 * Uses HSL Analysis + Texture Contrast Density.
 */

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export function validateLeafColor(canvas: HTMLCanvasElement): { isValid: boolean; score: number; reason?: string } {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { isValid: false, score: 0, reason: "Canvas context unavailable" };

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let leafPixels = 0;
  let totalPixels = width * height;
  let grayscaleVariance = 0;
  let meanBrightness = 0;

  // Step 1: Analyze HSL and Texture Variance
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    meanBrightness += brightness;

    const [h, s, l] = rgbToHsl(r, g, b);

    // Leaf Spectrum: Green (40-170)
    const isGreen = h >= 40 && h <= 170 && s > 0.15 && l > 0.1 && l < 0.9;
    
    // Some dead patches / spots are yellow-brown (15-40), but skin tones overlap here heavily.
    // We require higher saturation for organic yellow to exclude pale skin tones.
    const isOrganicYellow = h >= 15 && h < 40 && s > 0.35 && l > 0.15 && l < 0.8;

    if (isGreen || isOrganicYellow) {
      leafPixels++;
    }
  }

  meanBrightness /= totalPixels;

  // Step 2: Calculate Texture Complexity (Organic check)
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    grayscaleVariance += Math.abs(brightness - meanBrightness);
  }

  const leafPct = (leafPixels / totalPixels) * 100;
  const textureScore = Math.min((grayscaleVariance / (totalPixels / 4)) * 1.5, 35);
  const finalScore = (leafPct * 0.65) + textureScore;

  // STRICTER Hard Gate Threshold: 45 combined score, must have at least 15% leaf-like color
  const isHardGateValid = finalScore >= 45 && leafPct >= 15;

  return {
    isValid: isHardGateValid,
    score: Math.min(Math.round(finalScore), 100),
    reason: isHardGateValid ? undefined : (leafPct < 15 ? "No leaf detected (too little green/brown)" : "Image lacks organic leaf texture or color")
  };
}

/**
 * Normalizes image exposure by stretching the contrast (Basic Histogram Equalization).
 * Helps the AI model see details in dark or over-exposed field photos.
 */
export function normalizeExposure(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
    if (avg < min) min = avg;
    if (avg > max) max = avg;
  }

  if (max === min) return;

  const factor = 255 / (max - min);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (data[i]! - min) * factor;
    data[i + 1] = (data[i + 1]! - min) * factor;
    data[i + 2] = (data[i + 2]! - min) * factor;
  }

  ctx.putImageData(imageData, 0, 0);
}
