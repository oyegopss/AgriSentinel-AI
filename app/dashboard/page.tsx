"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  BarChart3,
  Store,
  Mic,
  ChevronRight,
  Activity,
  TrendingUp,
  Shield,
} from "lucide-react";

const TOOLS = [
  {
    title: "Disease Detection",
    description: "Upload a leaf image for instant AI diagnosis.",
    href: "/disease-detection",
    icon: Leaf,
    color: "#00FF9C",
  },
  {
    title: "Yield Prediction",
    description: "Predict harvest with crop, soil, and weather data.",
    href: "/yield-prediction",
    icon: BarChart3,
    color: "#00C3FF",
  },
  {
    title: "Mandi Intelligence",
    description: "Compare mandi prices and find the best market.",
    href: "/mandi-intelligence",
    icon: Store,
    color: "#1BFF00",
  },
  {
    title: "Voice Assistant",
    description: "Ask about disease, mandi, or yield by voice or text.",
    href: "/voice-assistant",
    icon: Mic,
    color: "#00C3FF",
  },
];

const STATS = [
  { label: "Detections today", value: "—", icon: Activity },
  { label: "Yield predictions", value: "—", icon: TrendingUp },
  { label: "Mandis tracked", value: "20+", icon: Shield },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Your smart farming command center. Choose a tool below to get started.
          </p>
        </motion.div>

        {/* Placeholder stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card neon-border rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF9C]/20">
                  <stat.icon className="h-5 w-5 text-[#00FF9C]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tool cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {TOOLS.map((tool, i) => (
            <Link key={tool.href} href={tool.href}>
              <motion.div
                className="glass-card neon-border flex items-center gap-6 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,156,0.12)]"
                whileHover={{ y: -4 }}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${tool.color}20` }}
                >
                  <tool.icon className="h-7 w-7" style={{ color: tool.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-white">
                    {tool.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">{tool.description}</p>
                </div>
                <ChevronRight className="h-6 w-6 shrink-0 text-[#00C3FF]/60" />
              </motion.div>
            </Link>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center text-sm text-gray-500"
        >
          Placeholder dashboard. Connect real stats and user data for production.
        </motion.p>
      </main>
    </div>
  );
}
