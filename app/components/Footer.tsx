"use client";

import { Github, ExternalLink, Database, Leaf } from "lucide-react";

const LINKS = [
  { label: "GitHub Repository", href: "https://github.com/oyegopss/AgriSentinel-AI", icon: Github },
  { label: "Live Demo", href: "https://agrisentinel-ai.vercel.app", icon: ExternalLink },
  { label: "PlantVillage Dataset", href: "https://www.kaggle.com/datasets/emmarex/plantdisease", icon: Leaf },
  { label: "data.gov.in API", href: "https://data.gov.in", icon: Database },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060A16]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-white">
              AgriSentinel <span className="text-[#00FF9C]">AI</span>
            </p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
              AI-powered crop health and market intelligence platform. Detect diseases, predict yield, and find the best mandi prices.
            </p>
          </div>
          <div className="flex-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Features</p>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li>AI Crop Disease Detection using CNN</li>
              <li>Grad-CAM Explainable AI visualization</li>
              <li>Crop Yield Prediction</li>
              <li>Smart Mandi Intelligence (Gov API)</li>
              <li>AI Crop Advisor recommendations</li>
              <li>Real-time browser inference with TensorFlow.js</li>
            </ul>
          </div>
          <div className="flex-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Links</p>
            <ul className="space-y-2">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#00FF9C]"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} AgriSentinel AI. Built with Next.js, TensorFlow.js &amp; Government Open Data.
        </div>
      </div>
    </footer>
  );
}
