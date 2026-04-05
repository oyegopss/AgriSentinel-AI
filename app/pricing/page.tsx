import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Handshake, Crown, ShieldCheck, Download, Users } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00FF9C]/10 blur-[120px]" />
         <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-12">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#00FF9C] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header matching Slide */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="font-display text-4xl md:text-6xl text-white font-black uppercase tracking-tight mb-6">
            Revenue Model & <br/>Business Strategy
          </h1>
          <div className="inline-block relative">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#00FF9C]" />
            <p className="text-xl md:text-2xl text-gray-300 font-medium italic relative z-10 pb-2 px-4">
              "Free for farmers. Paid by those who benefit from their data."
            </p>
          </div>
        </div>

        {/* 3 Pillar Deck Layout */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* B2G Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 flex flex-col items-center text-center transition-all hover:bg-white/[0.02] hover:border-[#00FF9C]/30 group">
             <div className="h-20 w-20 rounded-2xl bg-[#00FF9C] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,156,0.2)]">
               <Building2 className="h-10 w-10 text-black" />
             </div>
             <h3 className="font-display text-2xl font-black text-[#00FF9C] mb-4">B2G — Govt Licensing</h3>
             <p className="text-sm text-gray-300 leading-relaxed">
               License platform to state agriculture depts. Seamless integration with <span className="font-bold text-white">PM-KISAN</span> & <span className="font-bold text-white">NABARD</span> schemes for subsidy disbursement and monitoring.
             </p>
             <div className="mt-auto pt-8 w-full">
               <div className="h-[1px] w-full bg-white/10 mb-4" />
               <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                 <ShieldCheck className="h-4 w-4" /> State-level SLA
               </div>
             </div>
          </div>

          {/* B2B Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 flex flex-col items-center text-center transition-all hover:bg-white/[0.02] hover:border-amber-400/30 group">
             <div className="h-20 w-20 rounded-2xl bg-[#00FF9C] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,156,0.2)]">
               <Handshake className="h-10 w-10 text-black" />
             </div>
             <h3 className="font-display text-2xl font-black text-[#00FF9C] mb-4">B2B — Agri Companies</h3>
             <p className="text-sm text-gray-300 leading-relaxed">
               Sell anonymized crop & soil data insights to seed, fertilizer & agriculture insurance companies to predict demand and verify claims.
             </p>
             <div className="mt-auto pt-8 w-full">
               <div className="h-[1px] w-full bg-white/10 mb-4" />
               <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                 <Download className="h-4 w-4" /> API Data Access
               </div>
             </div>
          </div>

          {/* Freemium Card */}
          <div className="rounded-3xl border-2 border-[#00FF9C]/50 bg-[#0a0a0a] p-8 flex flex-col items-center text-center transition-all relative overflow-hidden group shadow-[0_0_40px_rgba(0,255,156,0.1)]">
             <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#00FF9C] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
               Farmer App
             </div>
             <div className="h-20 w-20 rounded-2xl bg-[#00FF9C] flex items-center justify-center mb-6 mt-2 group-hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,156,0.2)]">
               <Crown className="h-10 w-10 text-black" />
             </div>
             <h3 className="font-display text-2xl font-black text-[#00FF9C] mb-4">Freemium - Farmer</h3>
             <p className="text-sm text-gray-300 leading-relaxed mb-6">
               Basic detection & weather features <span className="font-bold text-white">free forever</span>. 
               <br/><br/>
               <span className="text-lg font-black text-[#00FF9C] border-b border-[#00FF9C]/30 pb-0.5">₹99/month</span> premium tier for advanced AI yield forecasting + deep Mandi analytics.
             </p>
             <div className="mt-auto pt-4 w-full">
               <button className="w-full rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/30 py-3 text-sm font-black uppercase tracking-widest text-[#00FF9C] hover:bg-[#00FF9C]/20 transition-colors">
                 Farmer Upgrade
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
