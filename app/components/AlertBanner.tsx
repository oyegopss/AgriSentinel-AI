"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight, X, Info } from "lucide-react";

export interface GlobalAlert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
}

interface AlertBannerProps {
  alerts: GlobalAlert[];
  onDismiss: (id: string) => void;
}

export const AlertBanner = ({ alerts, onDismiss }: AlertBannerProps) => {
  if (alerts.length === 0) return null;

  const currentAlert = alerts[0]; // Show top alert

  const getStyle = (type: string) => {
    switch (type) {
      case "critical": return "bg-red-600/90 text-white border-red-500/30";
      case "warning": return "bg-amber-500/90 text-[#050505] border-amber-400/30 font-bold";
      default: return "bg-[#00FF9C]/90 text-[#050505] border-[#00FF9C]/30 font-bold";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={`sticky top-0 z-[100] flex w-full items-center justify-between border-b px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 ${getStyle(currentAlert.type)}`}
      >
        <div className="flex flex-1 items-center justify-center gap-3">
          {currentAlert.type === "critical" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5 text-current" />}
          <p className="font-display text-xs sm:text-sm tracking-wide">
            {currentAlert.message}
          </p>
          <button className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest underline underline-offset-4 opacity-80 hover:opacity-100">
            Take Action <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <button 
          onClick={() => onDismiss(currentAlert.id)}
          className="ml-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
