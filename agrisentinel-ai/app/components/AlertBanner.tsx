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
  title = "High risk",
  message = "Disease risk is high or a disease has been detected. Review recommendations and take action.",
  className = "",
}: Props) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-200 ${className}`}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
      <div>
        <p className="font-semibold text-amber-100">{title}</p>
        <p className="mt-0.5 text-sm text-amber-200/90">{message}</p>
      </div>
    </div>
  );
}
