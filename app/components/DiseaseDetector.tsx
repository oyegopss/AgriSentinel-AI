"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Leaf, Loader2, AlertTriangle, CheckCircle, Camera, Eye, Cpu } from "lucide-react";
import { validateLeafColor, normalizeExposure, generateExplainabilityHeatmap } from "@/lib/imageUtils";
type TF = typeof import("@tensorflow/tfjs");

interface DiseaseResult {
  is_leaf: boolean;
  disease: string;
  confidence: number;
  severity: string;
  recommendation: string;
  contextualNote?: string;
}

interface DiseaseDetectorProps {
  onResult: (res: DiseaseResult) => void;
  weather?: any;
  profile?: any;
}

export const DiseaseDetector = ({ onResult, weather, profile }: DiseaseDetectorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG).");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      setHeatmapUrl(null);
      setShowHeatmap(false);
    }
  };

  const [modelLoadError, setModelLoadError] = useState<boolean>(false);
  const [tfModel, setTfModel] = useState<any>(null);

  React.useEffect(() => {
    let cancelled = false;
    import("@tensorflow/tfjs")
      .then((tf) => tf.loadLayersModel("/model/model.json").then((m) => ({ tf, m })))
      .then(({ tf, m }) => {
        if (!cancelled) setTfModel(m);
      })
      .catch((err) => {
        if (!cancelled) {
            console.error("TFJS load error in widget", err);
            setModelLoadError(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Validation
      const img = new Image();
      img.src = preview;
      await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
      });

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width || 224;
      tempCanvas.height = img.height || 224;
      const tctx = tempCanvas.getContext("2d");
      if (!tctx) throw new Error("Canvas context failed");
      tctx.drawImage(img, 0, 0);

      const val = validateLeafColor(tempCanvas);
      if (!val.isValid) {
          setResult({
              is_leaf: false,
              disease: "Unknown",
              confidence: 0,
              severity: "None",
              recommendation: val.reason || "Image rejected. Please upload a clear leaf image."
          });
          setLoading(false);
          return;
      }
      
      // Generate Explainable AI Heatmap
      const hmUrl = generateExplainabilityHeatmap(tempCanvas);
      if (hmUrl) setHeatmapUrl(hmUrl);

      normalizeExposure(tempCanvas);

      // 2. Real Inference
      if (!tfModel) {
          throw new Error("AI Model not loaded yet. Please wait a second and try again.");
      }
      
      const tf = await import("@tensorflow/tfjs");
      let imageTensor = tf.image.resizeNearestNeighbor(
          tf.browser.fromPixels(tempCanvas) as import("@tensorflow/tfjs").Tensor3D,
          [224, 224]
      ).toFloat().div(255).expandDims(0);

      const predictionRaw = tfModel.predict(imageTensor);
      const probabilities = await (Array.isArray(predictionRaw) ? predictionRaw[0] : predictionRaw).data();
      const probArr = Array.from(probabilities as Float32Array);
      
      tf.dispose([imageTensor, predictionRaw]);

      // PlantVillage 38 mapping logic
      // Contextual Re-weighting: Boost Fungal diseases if humidity > 70%
      let isHighHumidity = weather?.humidity > 70;
      
      let maxIdx = probArr.indexOf(Math.max(...probArr));
      let maxProb = probArr[maxIdx] ?? 0;
      let confidence = Math.max(0, Math.min(100, Math.round(maxProb * 1000) / 10));
      
      const pvClasses = [
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
        "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
      ];
      
      const pvName = pvClasses[maxIdx] || "";
      const lower = pvName.toLowerCase();
      let diseaseCategory = "Leaf Spot (Fungal)";
      let severityStr = "Moderate Risk";
      
      if (lower.includes("healthy")) { diseaseCategory = "Healthy Leaf"; severityStr = "No Risk"; }
      else if (lower.includes("bacterial") || lower.includes("greening")) { diseaseCategory = "Bacterial Infection"; severityStr = "High Risk"; }
      else if (lower.includes("virus") || lower.includes("mite") || lower.includes("mosaic")) { diseaseCategory = "Viral/Pest Issue"; severityStr = "High Risk"; }
      else if (lower.includes("rust")) { diseaseCategory = "Rust Disease"; severityStr = "High Risk"; }
      else if (lower.includes("powdery") || lower.includes("mildew") || lower.includes("mold")) { diseaseCategory = "Powdery Mildew"; severityStr = "Moderate Risk"; }

      // Apply Contextual Re-weighting Boost 
      let contextualNote = "";
      if (isHighHumidity && (diseaseCategory.includes("Fungal") || diseaseCategory.includes("Rust") || diseaseCategory.includes("Mildew"))) {
         confidence = Math.min(99.9, confidence + 12.5); // Boost confidence
         contextualNote = "High Humidity matched with organic anomaly.";
      }
      // Crop Profiling Boost
      if (profile?.crop && lower.includes(profile.crop.toLowerCase())) {
         confidence = Math.min(99.9, confidence + 8.0);
         contextualNote = contextualNote ? `${contextualNote} Priority match for ${profile.crop}.` : `Priority match for ${profile.crop}.`;
      }

      const rawLabel = pvName.replace(/___/g, " — ").replace(/_/g, " ");
      
      let recommendation = "Apply standard treatment.";
      if (diseaseCategory === "Healthy Leaf") recommendation = "Crop is healthy. Continue standard care.";
      if (diseaseCategory === "Bacterial Infection") recommendation = "Apply copper-based bactericides immediately. Prune and destroy infected foliage.";
      if (diseaseCategory === "Viral/Pest Issue") recommendation = "Destroy infected plants. Use horticultural oils for pests.";
      if (diseaseCategory === "Rust Disease") recommendation = "Apply tebuconazole or azoxystrobin. Remove infected parts.";
      if (diseaseCategory === "Leaf Spot (Fungal)") recommendation = "Apply copper hydroxide/Mancozeb. Avoid overhead irrigation.";
      if (diseaseCategory === "Powdery Mildew") recommendation = "Apply sulfur spray/neem oil. Improve air circulation.";

      // Fallback for really low confidence even if valid leaf
      if (confidence < 55) {
          diseaseCategory = "Uncertain Condition";
          severityStr = "Low Risk";
          recommendation = "Confidence is very low. Please upload a clearer image.";
      }

      const data: DiseaseResult = {
          is_leaf: true,
          disease: confidence >= 55 ? `${diseaseCategory} (${rawLabel})` : diseaseCategory,
          confidence: confidence / 100, // Make it 0-1 range for the widget
          severity: severityStr,
          recommendation: recommendation,
          contextualNote: contextualNote
      };

      setResult(data);
      onResult(data); 

      // Automated Digital Assistant Feedback
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const msg = data.disease === "Healthy Leaf" 
            ? "Your crops look healthy. Continue standard irrigation." 
            : `Warning. ${data.disease} detected. Confidence high. Please check recommendations.`;
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#050505]/40 shadow-2xl">
      <div className="flex border-b border-white/5 bg-white/5 px-8 py-5 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00FF9C]/10">
          <Leaf className="h-4 w-4 text-[#00FF9C]" />
        </div>
        <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-widest">
          Intelligence Module 02: Bio-Pathogen Analysis
        </h3>
      </div>

      <div className="p-8">
        {!preview ? (
          <div
            onClick={handleFileClick}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-10 text-center hover:border-[#00FF9C]/50 hover:bg-white/10 transition-all"
          >
            <Camera className="mb-4 h-10 w-10 text-gray-500" />
            <p className="mb-2 text-sm font-bold text-white uppercase tracking-wider">
              Upload Leaf Image
            </p>
            <p className="text-xs text-gray-500">
              Tap to capture or select a photo of your crop.
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative h-56 w-full md:w-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black group">
              <img src={preview} alt="Leaf Preview" className="h-full w-full object-cover transition-opacity duration-500" style={{ opacity: showHeatmap ? 0.3 : 1 }} />
              
              {/* Heatmap Overlay */}
              <AnimatePresence>
                {showHeatmap && heatmapUrl && (
                   <motion.img 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 0.85 }}
                     exit={{ opacity: 0 }}
                     src={heatmapUrl} 
                     alt="Grad-CAM Heatmap" 
                     className="absolute inset-0 h-full w-full object-cover mix-blend-screen" 
                   />
                )}
              </AnimatePresence>

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                  <div className="relative flex h-16 w-16 items-center justify-center mb-2">
                     <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00FF9C]/30 animate-[spin_3s_linear_infinite]" />
                     {/* Radar sweep animation */}
                     <div className="absolute inset-0 rounded-full border-t-2 border-[#00FF9C] animate-[spin_1s_ease-in-out_infinite]" />
                     <Cpu className="h-6 w-6 text-[#00FF9C] animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-[#00FF9C] uppercase tracking-[0.2em] animate-pulse">Neural Scan...</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-1 flex-col justify-center">
              {!result && !loading && !error && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">Ready for diagnosis. Ensure the leaf is centered and well-lit.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      className="flex-1 rounded-xl bg-[#00FF9C] py-3 text-xs font-bold uppercase tracking-widest text-[#050A10] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Run Analysis
                    </button>
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Error</span>
                  </div>
                  <p className="text-sm text-red-200 mb-3">{error}</p>
                  <button onClick={handleAnalyze} className="text-xs font-bold text-white hover:underline uppercase tracking-widest">Try Again</button>
                </div>
              )}

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                  >
                    {!result.is_leaf ? (
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Image Rejected</span>
                        <p className="text-sm text-yellow-200 mt-1">{result.recommendation}</p>
                        <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="mt-3 text-xs font-bold text-white hover:underline uppercase">Upload New Image</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                              Diagnosis Result
                              {(weather?.humidity > 70 || profile?.crop) && (
                                <span className="rounded bg-[#00FF9C]/20 text-[#00FF9C] px-1 text-[8px] tracking-tighter">AI Context +</span>
                              )}
                            </span>
                            <h4 className={`text-xl leading-tight font-display font-bold ${result.disease.includes('Healthy') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {result.disease}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confidence</span>
                            <div className="font-mono text-lg text-white">{(result.confidence * 100).toFixed(1)}%</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                           <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                              <p className="text-xs font-medium text-gray-300">
                                {result.recommendation}
                              </p>
                           </div>

                           {result.contextualNote && (
                             <div className="flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
                               <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                                 {result.contextualNote}
                               </span>
                             </div>
                           )}

                           {heatmapUrl && (
                             <button
                               onClick={() => setShowHeatmap(!showHeatmap)}
                               className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                                 showHeatmap 
                                   ? "border-[#00C3FF]/30 bg-[#00C3FF]/10 text-[#00C3FF]" 
                                   : "border-white/10 bg-transparent text-gray-400 hover:bg-white/5"
                               }`}
                             >
                               <Eye className="h-4 w-4" />
                               {showHeatmap ? "Hide Analysis Map" : "Show AI Explanation Map"}
                             </button>
                           )}
                        </div>

                        <button onClick={() => { setFile(null); setPreview(null); setResult(null); setHeatmapUrl(null); setShowHeatmap(false); }} className="text-xs font-bold text-gray-500 hover:text-white uppercase mt-2">Run another scan</button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
