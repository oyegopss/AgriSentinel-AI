"use client";

/**
 * Auth Page — AgriSentinel AI
 * Login / Signup toggle with Google OAuth, dark theme, neon green accents.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

// ── Google brand SVG (inline, no external dep) ───────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Input field component ─────────────────────────────────────────────────────
function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  placeholder,
  rightElement,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: any;
  placeholder: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-600 backdrop-blur-sm transition-all focus:border-[#00FF9C]/50 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-[#00FF9C]/30"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const clearForm = () => {
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleToggle = (newMode: "login" | "signup") => {
    clearForm();
    setMode(newMode);
  };

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "This email is already registered. Please log in.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/popup-closed-by-user": "Google sign-in cancelled.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment.",
      "auth/cancelled-popup-request": "Another sign-in popup is already open.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit triggered: ", { mode, email, hasPassword: !!password });
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUp(email, password, name.trim());
      } else {
        await signIn(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(friendlyError(err.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(friendlyError(err.code ?? ""));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050A10] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#00FF9C]/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-[#00C3FF]/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#1BFF00]/5 blur-[80px]" />
        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,156,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,156,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF9C]/15 ring-1 ring-[#00FF9C]/30 shadow-[0_0_30px_rgba(0,255,156,0.2)]">
            <Leaf className="h-8 w-8 text-[#00FF9C]" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-widest text-white uppercase">
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </h1>
          <p className="mt-1 text-xs text-gray-500 tracking-widest uppercase">
            Smart Farming Intelligence
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-white/8 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl"
        >
          {/* Tab toggle */}
          <div className="mb-8 flex rounded-2xl border border-white/8 bg-black/20 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleToggle(m)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  mode === m
                    ? "bg-[#00FF9C] text-[#050A10] shadow-[0_0_20px_rgba(0,255,156,0.3)]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "signup" && (
                <AuthInput
                  id="auth-name"
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  icon={User}
                  placeholder="Your name"
                />
              )}

              <AuthInput
                id="auth-email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                icon={Mail}
                placeholder="you@example.com"
              />

              <AuthInput
                id="auth-password"
                label="Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={setPassword}
                icon={Lock}
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Geolocation hint on signup */}
              {mode === "signup" && (
                <div className="flex items-center gap-2 rounded-xl border border-[#00FF9C]/15 bg-[#00FF9C]/5 px-4 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-[#00FF9C]/70" />
                  <p className="text-xs text-gray-400">
                    We'll auto-detect your location after sign-up for personalised weather &amp; mandi data.
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading || googleLoading}
                className="relative w-full overflow-hidden rounded-xl bg-[#00FF9C] py-3.5 text-sm font-bold uppercase tracking-widest text-[#050A10] shadow-[0_0_20px_rgba(0,255,156,0.25)] transition-all hover:bg-[#00e08a] hover:shadow-[0_0_35px_rgba(0,255,156,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "signup" ? "Creating account..." : "Signing in..."}
                  </span>
                ) : mode === "signup" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Create Account
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-gray-600">
            {mode === "login" ? (
              <>
                New to AgriSentinel?{" "}
                <button
                  type="button"
                  onClick={() => handleToggle("signup")}
                  className="text-[#00FF9C] hover:underline font-semibold"
                >
                  Create a free account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleToggle("login")}
                  className="text-[#00FF9C] hover:underline font-semibold"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>

        <p className="mt-6 text-center text-[10px] text-gray-700 tracking-widest uppercase">
          Secured by Firebase · Your data is private
        </p>
      </div>
    </div>
  );
}
