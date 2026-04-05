"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, X, Bot, Sparkles, MessageSquare, Activity } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceInput = ({ onTranscript }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Pre-load voices for instantaneous response
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    
    if (typeof window !== "undefined" && window.speechSynthesis) {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Stop anything currently speaking immediately to kill echo
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Multilingual Voice Mapping
    const hindiVoice = voices.find(v => v.lang.includes("hi-IN") && !v.name.includes("Pulse"));
    const marathiVoice = voices.find(v => v.lang.includes("mr-IN"));
    const tamilVoice = voices.find(v => v.lang.includes("ta-IN"));
    const enVoice = voices.find(v => v.lang.includes("en-IN"));

    // Set voice based on available ones
    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = "hi-IN";
    } else if (marathiVoice) {
      utterance.voice = marathiVoice;
      utterance.lang = "mr-IN";
    } else if (tamilVoice) {
      utterance.voice = tamilVoice;
      utterance.lang = "ta-IN";
    } else if (enVoice) {
      utterance.voice = enVoice;
      utterance.lang = "en-IN";
    }

    utterance.pitch = 1.0; 
    utterance.rate = 0.95;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const initSpeechRecognition = () => {
    if (typeof window === "undefined" || recognitionRef.current) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "hi-IN";

      recognition.onresult = (event: any) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Speech restart failed:", e);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Speech initialization failed:", e);
    }
  };

  useEffect(() => {
    initSpeechRecognition();
  }, []);

  // Use a ref for isListening to share with the end handler without re-running effect
  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const toggleListening = () => {
    // Attempt lazy-initialization one last time upon interaction
    if (!recognitionRef.current) {
      initSpeechRecognition();
    }

    if (!recognitionRef.current) {
      alert("Microphone connection not ready or browser not supported. Please refresh or use Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim().length > 2) {
        handleProcess();
      }
    } else {
      setShowModal(true);
      setTranscript("");
      setAiResponse(null);
      
      // Attempt to clear synthesis queue on start to prevent ghost voices
      window.speechSynthesis.cancel();
      
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Recognition already started or error — ignore
      }
      setIsListening(true);
    }
  };

  const handleManualClose = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel(); // Stop talking if we close
    setIsListening(false);
    setShowModal(false);
  };

  const handleProcess = async () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsProcessing(true);
    
    const userMsg = transcript;
    onTranscript(userMsg);
  };

  // Expose a way for the parent to push a response into the voice UI
  useEffect(() => {
    const handleAiReply = (e: any) => {
        if (e.detail?.text) {
            setAiResponse(e.detail.text);
            setIsProcessing(false);
            speak(e.detail.text);
        }
    };
    window.addEventListener("agrisentinel-ai-reply", handleAiReply);
    return () => {
        window.removeEventListener("agrisentinel-ai-reply", handleAiReply);
        window.speechSynthesis.cancel();
    };
  }, [voices]); // Depend on voices so we speak once they are ready

  return (
    <>
      {/* Floating Mic Button & Status */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-full bg-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg"
            >
              Listening...
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all ${
            isListening ? "bg-red-500 text-white" : "bg-[#00FF9C] text-[#050505]"
          }`}
        >
          {isListening ? (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <MicOff className="h-7 w-7" />
            </motion.div>
          ) : (
            <Mic className="h-7 w-7" />
          )}
        </motion.button>
      </div>

      {/* Voice Transcript Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-44 right-6 z-50 w-80 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]/95 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:w-96"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[#00FF9C]" />
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white">Voice Intelligence</h3>
              </div>
              <button onClick={handleManualClose} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="min-h-[120px] mb-6 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all relative">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                   <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div key={i} animate={{ height: [10, 25, 10] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.2 }} className="w-1 bg-[#00FF9C] rounded-full" />
                      ))}
                   </div>
                   <p className="text-[10px] text-[#00FF9C] font-bold uppercase tracking-widest animate-pulse">AI is Thinking...</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-3">
                   <div className="flex items-center gap-2 opacity-50">
                      <MessageSquare className="h-3 w-3 text-[#00FF9C]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9C]">AI Advisor</span>
                   </div>
                   <p className="text-sm font-medium text-white leading-relaxed">{aiResponse}</p>
                   <div className="flex justify-end pt-2">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="flex items-center gap-2 text-[8px] font-bold text-[#00FF9C] uppercase tracking-widest">
                         <Activity className="h-3 w-3" />
                         Speaking Response
                      </motion.div>
                   </div>
                </div>
              ) : transcript ? (
                <p className="text-lg font-medium text-white leading-relaxed">"{transcript}"</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00FF9C]/50" />
                  <p className="text-xs text-gray-500 italic tracking-widest">Listening to your request...</p>
                </div>
              )}
            </div>

            {transcript.length > 5 && !aiResponse && !isProcessing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleProcess}
                className="w-full rounded-xl bg-[#00FF9C] py-3 font-display text-sm font-black text-[#050505] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(0,255,156,0.5)] active:scale-95"
              >
                Sync with AI advisor
              </motion.button>
            )}

            {aiResponse && (
               <button 
                onClick={() => { setShowModal(false); setAiResponse(null); }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 font-display text-sm font-bold text-gray-400 tracking-widest uppercase hover:text-white transition-colors"
               >
                 Close Advisor
               </button>
            )}

            {!aiResponse && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Try saying:</p>
                <div className="flex gap-2">
                  <span className="text-[9px] bg-white/5 px-2 py-1 rounded-full border border-white/5 text-gray-400">"Meri fasal me problem kya hai?"</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
