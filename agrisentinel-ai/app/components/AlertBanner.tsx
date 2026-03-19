/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: UI alert banner (risk/disease) with pulse animation support
 */

"use client";

import { AlertTriangle } from "lucide-react";

type Props = {
  show: boolean;
  title?: string;
  message?: string;
  className?: string;
};

export default function AlertBanner({
  show,
  title = "⚠ High Risk Detected – Immediate Action Required",
  message = "Weather risk is High or disease severity is Severe. Take action now to prevent yield and quality loss.",
  className = "",
}: Props) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.18)] backdrop-blur-xl ${className}`}
    >
      <div className="relative mt-0.5 shrink-0">
        <span className="absolute -inset-1 rounded-full bg-rose-500/25 blur-md animate-pulse" />
        <AlertTriangle className="relative h-5 w-5 text-rose-300" />
      </div>
      <div>
        <p className="font-semibold text-rose-50">{title}</p>
        <p className="mt-0.5 text-sm text-rose-100/80">{message}</p>
      </div>
    </div>
  );
}
