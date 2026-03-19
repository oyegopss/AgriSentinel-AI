"use client";

/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Landing page for the demo (entry CTA + overview).
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  TrendingDown,
  BarChart3,
  Mic,
  Upload,
  Play,
  Bug,
  Store,
  ChevronRight,
  Cpu,
  Scan,
  Sparkles,
} from "lucide-react";
import ParticleBackground from "./components/ParticleBackground";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const fadeInUpSmooth = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const scrollReveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0A0F1F] text-gray-200 overflow-x-hidden">
      {/* Full-page particle background (fixed, behind all content) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-90">
        <ParticleBackground />
      </div>

      {/* ========== HERO ========== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16 bg-grid-pattern overflow-hidden">
        {/* Animated gradient background – neon #00FF9C, #00C3FF, #1BFF00 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 255, 156, 0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0, 195, 255, 0.2), transparent), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(27, 255, 0, 0.12), transparent)",
            }}
          />
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00FF9C]/25 blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.35, 0.55, 0.35],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00C3FF]/25 blur-[100px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.45, 0.25, 0.45],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-[#1BFF00]/15 blur-[80px] -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.p
            variants={fadeInUp}
            className="text-[#00C3FF] font-display text-sm uppercase tracking-[0.3em] mb-4"
            animate={{
              y: [0, -6, 0],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          >
            Smart Farming Intelligence
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6"
            animate={{
              y: [0, 8, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          >
            <span className="text-gradient">AgriSentinel</span>
            <span className="text-white"> AI</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-3 leading-relaxed"
            animate={{
              y: [0, 4, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          >
            AI-Powered Smart Farming Intelligence Platform
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-[#00FF9C]/90 max-w-xl mx-auto mb-12 font-medium"
            animate={{
              y: [0, 4, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.7 }}
          >
            Helping 140M+ Indian farmers make smarter decisions with AI
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.a
              href="/disease-detection"
              className="btn-glow-primary group flex items-center gap-2 px-8 py-4 rounded-full bg-[#00FF9C] text-[#0A0F1F] font-semibold glow-primary transition-all duration-300 hover:bg-[#00e08a]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Leaf className="w-5 h-5" />
              Try Disease Detection
            </motion.a>
            <motion.a
              href="#demo"
              className="btn-glow-outline group flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[#00C3FF] text-[#00C3FF] font-semibold transition-all duration-300 hover:bg-[#00C3FF]/10 hover:border-[#00FF9C] hover:shadow-[0_0_30px_rgba(0,255,156,0.3)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== PROBLEM ========== */}
      <section className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-[#0A0F1F]/80">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            The <span className="text-[#00FF9C]">Problem</span> We Solve
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-2xl mx-auto mb-16"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            Indian farmers face critical challenges that AgriSentinel AI addresses with AI.
          </motion.p>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              {
                icon: Bug,
                title: "Late disease detection",
                desc: "Farmers lose yield when diseases are spotted too late. We detect crop disease early from leaf images.",
                color: "#00FF9C",
              },
              {
                icon: BarChart3,
                title: "No yield prediction",
                desc: "No way to plan harvest or storage. We predict yield using weather, soil, and crop data.",
                color: "#00C3FF",
              },
              {
                icon: TrendingDown,
                title: "Price uncertainty",
                desc: "Selling at the wrong mandi or time cuts income. We compare prices and recommend the best market.",
                color: "#1BFF00",
              },
              {
                icon: Cpu,
                title: "Lack of AI tools",
                desc: "Rural farmers rarely get access to AI. We bring disease detection, yield prediction, and voice assistant to everyone.",
                color: "#00C3FF",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUpSmooth}
                className="glass-card neon-border p-8 rounded-2xl transition-all duration-300 group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00FF9C] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-grid-pattern">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            Our <span className="text-[#00C3FF]">Features</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-2xl mx-auto mb-16"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            Everything you need for data-driven farming in one platform.
          </motion.p>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              {
                icon: Sparkles,
                title: "AI Farmer Advisor",
                desc: "Full decision system: disease detection, yield impact, and best mandi in one flow.",
                href: "/advisor",
              },
              {
                icon: Leaf,
                title: "Crop Disease Detection",
                desc: "Upload a leaf image and get instant AI diagnosis with treatment suggestions.",
                href: "/disease-detection",
              },
              {
                icon: BarChart3,
                title: "AI Yield Prediction",
                desc: "Accurate harvest forecasts using weather, soil, and historical data.",
                href: "/yield-prediction",
              },
              {
                icon: Store,
                title: "Smart Mandi Intelligence",
                desc: "Compare mandi prices and find the best market for your crop.",
                href: "/mandi-intelligence",
              },
              {
                icon: Mic,
                title: "Voice Assistant",
                desc: "Ask questions in your language and get farming advice hands-free.",
                href: "/voice-assistant",
              },
            ].map((item) => {
              const Card = (
                <motion.div
                  variants={fadeInUpSmooth}
                  className="glass-card neon-border p-6 rounded-2xl transition-all duration-300 group cursor-default hover:shadow-[0_0_35px_rgba(0,255,156,0.15)]"
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#00FF9C]/20 flex items-center justify-center mb-4 group-hover:bg-[#00FF9C]/30 transition-all duration-300 group-hover:scale-110">
                    <item.icon className="w-6 h-6 text-[#00FF9C]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
              return item.href ? (
                <Link key={item.title} href={item.href} className="block">
                  {Card}
                </Link>
              ) : (
                <div key={item.title}>{Card}</div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-[#0A0F1F]/80">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            How It <span className="text-[#1BFF00]">Works</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-xl mx-auto mb-16"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            From input to insight in four simple steps.
          </motion.p>

          <motion.div
            className="grid sm:grid-cols-2 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              { step: 1, icon: Upload, label: "Upload crop leaf", detail: "Take a photo or upload a leaf image from your device." },
              { step: 2, icon: Scan, label: "Detect disease", detail: "AI identifies the disease and suggests treatment." },
              { step: 3, icon: BarChart3, label: "Predict yield", detail: "Get harvest forecasts based on crop, soil, and weather." },
              { step: 4, icon: Store, label: "Compare mandi prices", detail: "See which mandi offers the best price for your crop." },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUpSmooth}
                className="glass-card neon-border flex items-start gap-6 p-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,195,255,0.08)]"
              >
                <motion.div
                  className="shrink-0 w-14 h-14 rounded-full bg-linear-to-br from-[#00FF9C] to-[#00C3FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,156,0.3)]"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <item.icon className="w-7 h-7 text-[#0A0F1F]" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{item.label}</h3>
                  <p className="text-gray-400">{item.detail}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-[#00C3FF]/60 shrink-0 mt-1" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== TECHNOLOGY STACK ========== */}
      <section className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-grid-pattern">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            Technology <span className="text-[#00FF9C]">Stack</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-xl mx-auto mb-16"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            Built with modern tools for reliability and scale.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {["Next.js", "Flask", "TensorFlow", "OpenCV", "Weather API"].map((tech) => (
              <motion.div
                key={tech}
                variants={fadeInUpSmooth}
                className="glass-card neon-border px-8 py-4 rounded-xl font-display font-semibold text-[#00C3FF] transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,195,255,0.15)]"
                whileHover={{ scale: 1.05 }}
              >
                {tech}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== IMPACT ========== */}
      <section className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-[#0A0F1F]/80">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            Our <span className="text-[#1BFF00]">Impact</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-xl mx-auto mb-16"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            Empowering farmers with AI for a sustainable future.
          </motion.p>

          <motion.div
            className="grid sm:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              { value: "30%", label: "Crop loss reduction", sub: "Early disease detection" },
              { value: "Better", label: "Farmer income", sub: "Smart mandi & yield insights" },
              { value: "AI", label: "For rural India", sub: "Voice-first, language-inclusive" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUpSmooth}
                className="glass-card neon-border text-center p-8 rounded-2xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(27,255,0,0.1)]"
              >
                <motion.span
                  className="font-display text-4xl sm:text-5xl font-bold text-gradient block mb-2"
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  {stat.value}
                </motion.span>
                <h3 className="text-xl font-semibold text-white mb-1">{stat.label}</h3>
                <p className="text-gray-400 text-sm">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== DEMO ========== */}
      <section id="demo" className="relative z-10 py-16 px-4 sm:py-24 sm:px-6 bg-grid-pattern">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-4 text-white"
            {...scrollReveal}
          >
            Try <span className="text-[#00FF9C]">Disease Detection</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center max-w-xl mx-auto mb-12"
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.08 }}
          >
            Upload a crop leaf image to get an instant AI diagnosis.
          </motion.p>

          <Link href="/disease-detection">
            <motion.div
              className="glass-card neon-border rounded-2xl border-2 border-dashed border-[#00FF9C]/40 p-12 text-center transition-all duration-300 hover:border-[#00FF9C]/60 hover:shadow-[0_0_40px_rgba(0,255,156,0.12)] cursor-pointer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#00FF9C]/20 flex items-center justify-center ring-2 ring-[#00FF9C]/30">
                  <Upload className="w-10 h-10 text-[#00FF9C]" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Drop your image here or click to upload</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
                </div>
                <motion.span
                  className="btn-glow-primary mt-4 inline-block px-6 py-3 rounded-full bg-[#00FF9C] text-[#0A0F1F] font-semibold transition-all duration-300 hover:bg-[#00e08a]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Choose file
                </motion.span>
              </div>
            </motion.div>
          </Link>

          <motion.p
            className="text-center text-gray-500 text-sm mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Opens the full Disease Detection tool — upload or scan with camera.
          </motion.p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative z-10 py-10 px-4 sm:py-12 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-lg text-[#00FF9C] font-semibold">
            AgriSentinel AI
          </p>
          <p className="text-gray-500 text-sm">
            AI-Powered Smart Farming Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
