"use client";

/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Loading spinner component used across demo screens.
 */

import { motion } from "framer-motion";

type LoadingSpinnerProps = {
  message?: string;
  className?: string;
};

export default function LoadingSpinner({
  message = "AI is analyzing…",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/5 py-12 ${className}`}
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-12 w-12 rounded-full border-2 border-[#00FF9C]/30 border-t-[#00FF9C]"
      />
      <p className="ai-loading-text text-center text-sm font-medium text-[#00FF9C]">
        {message}
      </p>
    </motion.div>
  );
}
