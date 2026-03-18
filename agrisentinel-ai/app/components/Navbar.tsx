"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Disease Detection", href: "/disease-detection" },
  { label: "Yield Prediction", href: "/yield-prediction" },
  { label: "Mandi Intelligence", href: "/mandi-intelligence" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`nav-link relative rounded-lg px-3 py-2 font-display text-sm font-medium transition-all duration-300 md:text-base ${
        isActive
          ? "nav-link-active text-[#00FF9C]"
          : "text-gray-300 hover:text-[#00FF9C]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0F1F]/70 backdrop-blur-xl"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-lg font-bold text-white transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00FF9C]/20 text-[#00FF9C]">
            <Leaf className="h-5 w-5" />
          </span>
          <span>
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </span>
        </Link>

        {/* Desktop nav with glow hover */}
        <div className="hidden md:flex md:items-center md:gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Mobile menu button – touch-friendly */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="touch-target flex items-center justify-center rounded-lg p-3 text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5 bg-[#0A0F1F]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`touch-target flex items-center rounded-lg px-4 py-3 font-display text-sm font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-[#00FF9C]/20 text-[#00FF9C]"
                      : "text-gray-300 hover:bg-[#00FF9C]/10 hover:text-[#00FF9C]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
