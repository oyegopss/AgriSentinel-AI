"use client";

/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Voice assistant demo UI for farm questions.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Bot, User, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

/** 
 * Smart rule-based fallback (used when backend unreachable) 
 * — much smarter than pure keyword matching.
 */
function getFallbackResponse(userText: string): string {
  const lower = userText.toLowerCase().trim();
  if (lower.includes("disease") || (lower.includes("crop") && (lower.includes("sick") || lower.includes("wrong") || lower.includes("affect")))) {
    return "Upload a leaf photo on the Disease Detection page. Our CNN model identifies 38 crop diseases including Powdery Mildew, Leaf Spot, Rust, and Blight. After detection, I'll recommend a specific pesticide with dosage and cost estimate.";
  }
  if (lower.includes("keetnaashak") || lower.includes("pesticide") || lower.includes("spray") || lower.includes("treatment")) {
    return "Treatment recommendation depends on the detected disease. Common options: Mancozeb 75% WP for fungal leaf spots (₹800–1200/acre), Propiconazole 25% EC for rust disease (₹1200–1800/acre), Sulfur 80% WP for powdery mildew (₹500–800/acre). Always spray in the morning below 32°C.";
  }
  if (lower.includes("mandi") || lower.includes("price") || lower.includes("market") || lower.includes("sell") || lower.includes("bechna")) {
    return "Our Smart Mandi Intelligence uses real Agmarknet (govt) data to show you live prices and calculates nearest mandi distance using GPS. Go to the dashboard and check the \"Smart Mandi Intelligence\" section. The best market is highlighted in green with expected net profit after transport cost.";
  }
  if (lower.includes("yield") || lower.includes("production") || lower.includes("harvest") || lower.includes("fasal")) {
    return "Try the Yield Prediction page. Enter your crop type, soil type, area, and recent rainfall to get an AI yield estimate in quintals per acre. It also shows impact of disease on expected yield.";
  }
  if (lower.includes("weather") || lower.includes("rain") || lower.includes("humidity") || lower.includes("mausam")) {
    return "Current weather data is live from OpenWeatherMap. High humidity above 70% means high fungal risk — you'll see a risk alert on your dashboard. Check the 5-day forecast and atmospheric module on the dashboard.";
  }
  if (lower.includes("pest") || lower.includes("keeda") || lower.includes("insect") || lower.includes("bug")) {
    return "Our Pest Risk Alert uses your crop type and weather data to predict pest pressure. Common pests include Aphids (wheat, humid+cool), Yellow Stem Borer (rice, hot+humid), Pink Bollworm (cotton, hot). Check the dashboard Pest Risk card for your specific recommendation.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("namaste") || lower.includes("help")) {
    return "Namaste! Main AgriSentinel AI hoon. Aap mujhse puch sakte hain: fasal ki bimari, mandi ke bhav, keeton ka khatra, ya paidavar ka anuman. Kya jaanna chahte hain?";
  }
  return "I'm your AgriSentinel AI assistant. I can help with: (1) Crop disease detection & treatment plans, (2) Live mandi prices with nearest market distance, (3) Pest risk alerts based on weather + crop, and (4) Yield prediction. What would you like to know?";
}

/** Call the real backend LLM agent. Falls back to rule-based if unavailable. */
async function getAgentResponse(userText: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // Try the local Next.js AI agent first (always available — no external dependency)
    const res = await fetch(`/api/ai-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userText }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const advice = data.response || data.advice || data.recommendation || data.message;
      if (advice) return String(advice);
    }
  } catch {
    // If local route fails (unlikely), try external backend
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res2 = await fetch(`${baseUrl}/api/ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText }),
      });
      if (res2.ok) {
        const data = await res2.json();
        const advice = data.advice || data.recommendation || data.message || data.response;
        if (advice) return String(advice);
      }
    } catch {
      console.log("Voice Assistant: All backends offline, using local fallback.");
    }
  } finally {
    clearTimeout(timeoutId);
  }
  return getFallbackResponse(userText);
}


type SpeechRecognitionCtor = new () => {
  start(): void;
  stop(): void;
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi, I’m AgriSentinel. Ask me about crop disease, mandi prices, or yield prediction. Tap the mic and speak." },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addResponseRef = useRef<(userText: string) => void>(() => {});

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, interimTranscript, isProcessing, scrollToBottom]);

  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  const addResponse = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: userText.trim() }]);
    setIsProcessing(true);
    
    // Small delay so user sees their message first
    await new Promise(r => setTimeout(r, 400));
    
    const reply = await getAgentResponse(userText);
    
    setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    setIsProcessing(false);
  }, []);

  addResponseRef.current = addResponse;

  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR || typeof window === "undefined") return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) {
        setInterimTranscript("");
        addResponseRef.current(final);
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = (event: { error: string }) => {
      setIsListening(false);
      setInterimTranscript("");
      if (event.error === "no-speech") return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Could not hear clearly. Error: ${event.error}. Try again or type your question below.` },
      ]);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isListening) {
      rec.stop();
      return;
    }
    setInterimTranscript("");
    rec.start();
    setIsListening(true);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    addResponse(textInput);
    setTextInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0F1F] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F1F]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display flex items-center gap-2 text-sm font-semibold text-[#00C3FF] transition-colors hover:text-[#00FF9C]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <span className="font-display text-lg font-bold text-white">
            AgriSentinel <span className="text-[#00FF9C]">AI</span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Voice <span className="text-gradient">Assistant</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Ask about disease, mandi prices, or yield—by voice or text.
          </p>
        </motion.div>

        {/* Chat area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card neon-border flex flex-1 flex-col overflow-hidden rounded-2xl"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth" ref={scrollRef}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-[#00C3FF]/20 text-[#00C3FF]"
                        : "bg-[#00FF9C]/20 text-[#00FF9C]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-[#00C3FF]/15 text-gray-100 rounded-br-md"
                        : "bg-white/5 text-gray-300 border border-white/10 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00FF9C]/20 text-[#00FF9C]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-white/5 px-4 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00FF9C]/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00FF9C]/60 [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00FF9C]/60 [animation-delay:0.4s]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 flex-row-reverse mt-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C3FF]/20 text-[#00C3FF]">
                  <User className="h-4 w-4" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#00C3FF]/10 px-4 py-2.5">
                  <p className="text-sm text-gray-400 italic leading-relaxed">{interimTranscript}...</p>
                </div>
              </motion.div>
            )}
            <div className="h-4" />
          </div>

          {/* Input area */}
          <div className="border-t border-white/10 bg-black/20 p-4">
            {isSupported === false && (
              <p className="mb-3 text-center text-xs text-amber-400/90">
                Voice input is not supported in this browser. Use the text box below.
              </p>
            )}
            <div className="flex items-center gap-3">
              {isSupported && (
                <motion.button
                  type="button"
                  onClick={toggleListening}
                  disabled={!isSupported}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                    isListening
                      ? "bg-[#FF4757]/20 text-[#FF4757] shadow-[0_0_30px_rgba(255,71,87,0.3)]"
                      : "bg-[#00FF9C]/20 text-[#00FF9C] hover:bg-[#00FF9C]/30 hover:shadow-[0_0_25px_rgba(0,255,156,0.25)]"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  animate={isListening ? { scale: [1, 1.08, 1] } : {}}
                  transition={isListening ? { duration: 1.2, repeat: Infinity } : {}}
                >
                  {isListening ? (
                    <MicOff className="h-7 w-7" />
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </motion.button>
              )}
              <form onSubmit={handleTextSubmit} className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/30"
                />
                <motion.button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00FF9C] text-[#0A0F1F] transition-colors disabled:opacity-40 hover:bg-[#00e08a]"
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </form>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              {isListening ? "Listening… speak now." : "Tap mic to speak or type below."}
            </p>
          </div>
        </motion.div>

        {/* Suggested questions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
            Try asking
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "What disease is affecting my crop?",
              "Which mandi has the best price?",
              "How do I predict yield?",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => addResponse(q)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-gray-400 transition-colors hover:border-[#00FF9C]/40 hover:bg-[#00FF9C]/10 hover:text-[#00FF9C]"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
