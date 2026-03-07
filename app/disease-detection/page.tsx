"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowLeft, Leaf, AlertCircle, CheckCircle2, Flame } from "lucide-react";

const DISEASES = [
  {
    name: "Healthy Leaf",
    treatment: "No action needed. Continue regular monitoring and maintain good irrigation and nutrition practices.",
    icon: CheckCircle2,
    color: "#00FF9C",
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
] as const;

function simulateDetection(): (typeof DISEASES)[number] & { confidence: number } {
  const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)]!;
  const confidence = Math.round((85 + Math.random() * 14) * 10) / 10;
  return { ...disease, confidence };
}

export default function DiseaseDetectionPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateDetection> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setResult(null);
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

  const handleDetect = () => {
    if (!imagePreview) return;
    setIsDetecting(true);
    setResult(null);
    setTimeout(() => {
      setResult(simulateDetection());
      setIsDetecting(false);
    }, 2000);
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

      <main className="mx-auto max-w-2xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AI Crop <span className="text-gradient">Disease Detection</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Upload a crop leaf image and let AI detect possible diseases.
          </p>
        </motion.div>

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

          {/* 1. Image Upload – drag and drop or upload button */}
          {!imagePreview ? (
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
                    onClick={handleDetect}
                    className="btn-glow-primary w-full rounded-xl bg-[#00FF9C] py-4 font-display text-lg font-semibold text-[#0A0F1F] transition-all hover:bg-[#00e08a] sm:w-auto sm:px-12"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {result ? "Analyze again" : "Analyze Crop"}
                  </motion.button>
                </motion.div>
              )}

              {/* 4. Loading Animation – 2 seconds, spinner + text */}
              <AnimatePresence mode="wait">
                {isDetecting && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 py-12"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-12 w-12 rounded-full border-2 border-[#00FF9C]/30 border-t-[#00FF9C]"
                    />
                    <p className="font-medium text-[#00FF9C]">
                      AI model analyzing crop health…
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>

        {/* Result card – after 2 seconds */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card neon-border mt-8 overflow-hidden rounded-2xl p-6 transition-all duration-300 sm:p-8"
            >
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
                <div className="rounded-lg bg-white/5 px-4 py-3">
                  <span className="text-gray-400">Confidence: </span>
                  <span
                    className="font-display font-bold"
                    style={{ color: result.color }}
                  >
                    {result.confidence}%
                  </span>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-sm font-medium text-gray-400">Recommendation:</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {result.treatment}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
