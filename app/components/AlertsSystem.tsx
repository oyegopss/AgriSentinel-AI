"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Bell, X, Info, CheckCircle, Flame, ShieldAlert } from "lucide-react";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface AlertNotification {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
}

export const AlertsSystem = () => {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Initial simulated alerts for demo
  useEffect(() => {
    const demoAlerts: AlertNotification[] = [
      {
        id: "1",
        severity: "high",
        title: "Fungal Risk High",
        message: "Humidity (88%) exceeds safety threshold for Wheat.",
        timestamp: "Just now"
      },
      {
        id: "2",
        severity: "medium",
        title: "Market Opportunity",
        message: "Lucknow Mandi price for Wheat increased by ₹120.",
        timestamp: "1 hour ago"
      },
      {
        id: "3",
        severity: "low",
        title: "Weather Update",
        message: "Moderate rainfall expected tomorrow night.",
        timestamp: "3 hours ago"
      }
    ];
    setAlerts(demoAlerts);
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical": return "border-red-500/50 bg-red-500/10 text-red-400";
      case "high": return "border-orange-500/50 bg-orange-500/10 text-orange-400";
      case "medium": return "border-[#00C3FF]/50 bg-[#00C3FF]/10 text-[#00C3FF]";
      default: return "border-[#00FF9C]/30 bg-[#00FF9C]/5 text-[#00FF9C]";
    }
  };

  const getIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical": return <ShieldAlert className="h-4 w-4" />;
      case "high": return <Flame className="h-4 w-4" />;
      case "medium": return <Info className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#050505] border border-white/10 text-[#00FF9C] shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:border-[#00FF9C]/60"
      >
        <Bell className="h-6 w-6" />
        {alerts.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-[#050505]">
            {alerts.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]/95 shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">Farmer Alert Center</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-[450px] overflow-y-auto p-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-gray-600 italic text-sm">
                  No active alerts. Your farm is stable.
                </div>
              ) : (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group relative flex gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.02] ${getSeverityStyle(alert.severity)}`}
                  >
                    <div className="mt-1 shrink-0">{getIcon(alert.severity)}</div>
                    <div className="flex-1 pr-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">{alert.title}</p>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">{alert.message}</p>
                      <p className="mt-3 text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">{alert.timestamp}</p>
                    </div>
                    <button 
                      onClick={() => removeAlert(alert.id)}
                      className="absolute right-3 top-4 text-white/20 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            
            {alerts.length > 0 && (
              <div className="border-t border-white/10 bg-white/5 px-6 py-4 text-center">
                <button 
                  onClick={() => setAlerts([])}
                  className="text-[10px] font-bold text-[#00FF9C] uppercase tracking-[0.3em] hover:underline"
                >
                  Clear All Alerts
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
