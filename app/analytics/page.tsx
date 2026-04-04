"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, Cell, Legend 
} from "recharts";
import { 
  TrendingUp, 
  ChevronLeft, 
  Calendar, 
  Download, 
  Activity, 
  Coins, 
  Sprout, 
  Microscope 
} from "lucide-react";
import Link from "next/link";

const YIELD_DATA = [
  { month: "Jan", yield: 2.1, projected: 2.3 },
  { month: "Feb", yield: 2.4, projected: 2.5 },
  { month: "Mar", yield: 3.2, projected: 3.1 },
  { month: "Apr", yield: 3.9, projected: 4.0 },
  { month: "May", yield: 4.5, projected: 4.4 },
  { month: "Jun", yield: 4.8, projected: 4.9 },
];

const PROFIT_DATA = [
  { name: "Market A", price: 21000, transport: 1200 },
  { name: "Market B", price: 22500, transport: 2400 },
  { name: "Market C", price: 19800, transport: 600 },
  { name: "Market D", price: 21800, transport: 1800 },
];

const DISEASE_DATA = [
  { name: "Week 1", infection: 5 },
  { name: "Week 2", infection: 12 },
  { name: "Week 3", infection: 28 },
  { name: "Week 4", infection: 15 },
  { name: "Week 5", infection: 8 },
  { name: "Week 6", infection: 4 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Last 6 Months");

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-10 flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-[#00FF9C]"
          >
            <ChevronLeft className="h-4 w-4" />
            Command Center
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold transition-all hover:bg-white/5 active:scale-95">
               <Download className="h-4 w-4" /> Export Report
            </button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
               {["Weekly", "Monthly", "Yearly"].map(t => (
                  <button key={t} className="px-3 py-1 text-[10px] font-bold rounded-lg hover:bg-white/5 transition-all">
                    {t}
                  </button>
               ))}
            </div>
          </div>
        </div>

        {/* Title */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="mb-12"
        >
          <h1 className="font-display text-4xl font-black text-white uppercase tracking-widest leading-tight">
            Farm <span className="text-[#00FF9C]">Performance Analytics</span>
          </h1>
          <p className="mt-4 text-gray-500 font-medium tracking-wide">Detailed season telemetry and profit optimization charts.</p>
        </motion.div>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
           {[
              { label: "Aggregate Yield", v: "4.82t", diff: "+12.4%", icon: Sprout, color: "text-[#00FF9C]" },
              { label: "Net Profitability", v: "₹82,450", diff: "+5.1%", icon: Coins, color: "text-[#00C3FF]" },
              { label: "Avg. Health", v: "92%", diff: "-1.2%", icon: Activity, color: "text-emerald-400" },
              { label: "Detection Events", v: "42", diff: "-18%", icon: Microscope, color: "text-orange-400" }
           ].map((kpi, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="glass-card rounded-[2rem] border border-white/5 bg-white/[0.01] p-6"
             >
                <div className="flex items-center gap-3 mb-6">
                   <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                   </div>
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</span>
                </div>
                <div className="flex items-end justify-between">
                   <p className="text-2xl font-display font-medium text-white tracking-widest">{kpi.v}</p>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.diff.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {kpi.diff}
                   </span>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
           {/* Primary Yield Chart */}
           <div className="lg:col-span-8 space-y-8">
              <div className="glass-card rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 shadow-2xl">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-3">
                       <TrendingUp className="h-5 w-5 text-[#00FF9C]" />
                       Season Yield Output <span className="text-xs text-gray-600 font-bold tracking-widest uppercase ml-4">Tonnes / Hectare</span>
                    </h3>
                 </div>
                 <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={YIELD_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                          <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} fontWeight="bold" dy={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#ffffff30" fontSize={10} fontWeight="bold" dx={-10} axisLine={false} tickLine={false} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: "#050505", borderRadius: "16px", border: "1px solid #ffffff10", padding: "12px" }}
                             itemStyle={{ textTransform: "uppercase", fontSize: "10px", fontWeight: "bold" }}
                          />
                          <Line type="monotone" dataKey="yield" stroke="#00FF9C" strokeWidth={4} dot={{ fill: "#00FF9C", strokeWidth: 2, r: 4 }} activeDot={{ r: 8, stroke: "#00FF9C", strokeWidth: 4 }} />
                          <Line type="monotone" dataKey="projected" stroke="#ffffff15" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Profit Analysis */}
              <div className="glass-card rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 shadow-2xl">
                 <h3 className="font-display font-bold text-lg text-white mb-10 flex items-center gap-3">
                    <Coins className="h-5 w-5 text-[#00C3FF]" />
                    Market Net Profit Analysis <span className="text-xs text-gray-600 font-bold tracking-widest uppercase ml-4">Currency INR</span>
                 </h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={PROFIT_DATA} barSize={40}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                           <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                           <YAxis stroke="#ffffff30" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                           <Tooltip 
                             cursor={{ fill: '#ffffff05' }}
                             contentStyle={{ backgroundColor: "#050505", borderRadius: "16px", border: "1px solid #ffffff10" }}
                             itemStyle={{ textTransform: "uppercase", fontSize: "10px", fontWeight: "bold" }}
                           />
                           <Bar dataKey="price" fill="#00FF9C" radius={[8, 8, 0, 0]} />
                           <Bar dataKey="transport" fill="#ffffff10" radius={[8, 8, 0, 0]} />
                           <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Sidebar: Disease Spikes */}
           <div className="lg:col-span-4 self-start">
              <div className="glass-card rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 shadow-2xl">
                 <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#00FF9C] mb-8">
                    Infection Intensity <span className="text-[10px] text-gray-500 ml-2">6 Week Cycle</span>
                 </h3>
                 <div className="h-64 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={DISEASE_DATA}>
                          <defs>
                             <linearGradient id="colorInfection" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00FF9C" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00FF9C" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <Area type="step" dataKey="infection" stroke="#00FF9C" fillOpacity={1} fill="url(#colorInfection)" strokeWidth={2} />
                          <Tooltip contentStyle={{ backgroundColor: "#050505", borderRadius: "12px", border: "1px solid #ffffff10", fontSize: "10px" }} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4 pt-8 border-t border-white/5">
                    {[
                      { l: "Fungal Index", v: "Normal", c: "text-emerald-400" },
                      { l: "Pest Activity", v: "High Alert", c: "text-red-400" },
                      { l: "Nutrient Flow", v: "Optimal", c: "text-[#00C3FF]" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{item.l}</span>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${item.c}`}>{item.v}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
