"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Zap, BellOff } from "lucide-react";
import { AlertMessage } from "@/lib/alertsEngine";

interface SmartAlertsCardProps {
  alerts: AlertMessage[];
  loading?: boolean;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  critical: Zap,
};

const styleMap = {
  info: {
    icon: "text-sky-400",
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-500/[0.12]",
    dot: "bg-sky-400",
  },
  warning: {
    icon: "text-amber-400",
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/[0.12]",
    dot: "bg-amber-400",
  },
  critical: {
    icon: "text-red-400",
    bg: "bg-red-500/[0.06]",
    border: "border-red-500/[0.12]",
    dot: "bg-red-400",
  },
};

export const SmartAlertsCard = ({
  alerts,
  loading = false,
}: SmartAlertsCardProps) => {
  const hasCritical = alerts.some((a) => a.type === "critical");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Smart Alerts
          </span>
        </div>
        {!loading && alerts.length > 0 && (
          <div className="flex items-center gap-1.5">
            {hasCritical && (
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            )}
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              {alerts.length} active
            </span>
          </div>
        )}
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-xl bg-white/[0.03] animate-pulse"
            />
          ))
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <BellOff className="h-7 w-7 text-gray-700" />
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">
              No active alerts
            </p>
            <p className="text-[10px] text-gray-700">
              All environmental signals are within normal range.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const Icon = iconMap[alert.type];
              const style = styleMap[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex gap-3 rounded-xl border px-4 py-3 ${style.bg} ${style.border}`}
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className={`h-3.5 w-3.5 ${style.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${style.icon}`}>
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
