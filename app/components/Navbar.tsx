"use client";

/**
 * Navbar — AgriSentinel AI
 * Auth-aware: shows Sign In CTA when logged out, user avatar + Sign Out when logged in.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf, LogIn, LogOut, User, Globe, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Disease Detection", href: "/disease-detection" },
  { label: "Yield Prediction", href: "/yield-prediction" },
  { label: "Mandi Intelligence", href: "/mandi-intelligence" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`nav-link relative rounded-lg px-3 py-2 font-display text-sm font-medium transition-all duration-300 md:text-base ${
        isActive ? "nav-link-active text-[#00FF9C]" : "text-gray-300 hover:text-[#00FF9C]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, profile, signOut, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    router.push("/auth");
  };

  const displayName = profile?.displayName || user?.displayName || "Farmer";
  const nameInitial = displayName.charAt(0).toUpperCase();

  const [isOffline, setIsOffline] = useState(false);

  const toggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    if (next) {
      document.documentElement.classList.add("demo-offline");
      window.dispatchEvent(new Event("offline"));
    } else {
      document.documentElement.classList.remove("demo-offline");
      window.dispatchEvent(new Event("online"));
    }
  };

  const [currentLang, setCurrentLang] = useState("EN");

  const triggerTranslation = (langCode: string, displayKey: string) => {
    setCurrentLang(displayKey);
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    }
  };

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

        {/* Desktop nav */}
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

        {/* Desktop auth controls & Pitch Features */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {/* Pitch: Multi-language */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 transition-colors">
            <Globe className="h-3.5 w-3.5 text-gray-400" />
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <button onClick={() => triggerTranslation('en', 'EN')} className={`${currentLang === 'EN' ? 'text-white' : 'opacity-40 hover:opacity-100 hover:text-white'} transition-opacity`}>EN</button>
              <span className="opacity-40">|</span>
              <button onClick={() => triggerTranslation('hi', 'HI')} className={`${currentLang === 'HI' ? 'text-white' : 'opacity-40 hover:opacity-100 hover:text-white'} transition-opacity`}>HI</button>
              <span className="opacity-40">|</span>
              <button onClick={() => triggerTranslation('mr', 'MR')} className={`${currentLang === 'MR' ? 'text-white' : 'opacity-40 hover:opacity-100 hover:text-white'} transition-opacity`}>MR</button>
            </div>
          </div>

          {!mounted || loading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            // Logged in: Pro badge + avatar + sign out
            <div className="flex items-center gap-3">
              <Link 
                 href="/pricing"
                 className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 relative transition-colors hover:bg-amber-500/20 cursor-pointer"
              >
                 <Shield className="h-3 w-3 text-amber-500" />
                 <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pro</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-3 pr-1.5 py-1 hover:bg-white/10 transition-all"
              >
                <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">
                  {displayName}
                </span>
                <div className="h-7 w-7 rounded-full bg-[#00FF9C] text-[#050505] flex items-center justify-center font-black text-xs">
                  {nameInitial}
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Logged out: Sign In CTA
            <Link
              href="/auth"
              className="flex items-center gap-2 rounded-full bg-[#00FF9C] px-5 py-2 font-display text-xs font-bold uppercase tracking-widest text-[#0A0F1F] shadow-[0_0_20px_rgba(0,255,156,0.2)] hover:bg-[#00e08a] hover:shadow-[0_0_30px_rgba(0,255,156,0.35)] transition-all ml-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
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

              {/* Mobile auth */}
              <div className="mt-3 border-t border-white/8 pt-3">
                {!mounted || loading ? (
                  <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
                ) : user ? (
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 transition-all"
                    >
                      <div className="h-7 w-7 rounded-full bg-[#00FF9C] text-[#050505] flex items-center justify-center font-black text-xs">
                        {nameInitial}
                      </div>
                      <span>{displayName}</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#00FF9C] py-3 font-display text-xs font-bold uppercase tracking-widest text-[#0A0F1F]"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In / Sign Up
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
