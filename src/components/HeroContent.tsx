"use client";

import React from "react";
import { ArrowRight, Play, Terminal } from "lucide-react";

export default function HeroContent() {
  return (
    <div className="flex flex-col items-center mx-auto max-w-6xl mt-16 relative z-[2] px-6">
      
      {/* 🟢 System Status Badge */}
      <div className="flex flex-col items-center gap-1 group cursor-default">
  {/* The Text: High tracking, bold, and italic for that aggressive look */}
  <div className="text-[11px] font-black italic tracking-[1.2em] text-white uppercase ml-[1.2em]">
    Visceral
  </div>
  
  {/* The Accent: A sharp red bar that matches your brand image */}
  <div className="relative">
    <div className="h-[2px] w-8 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all duration-500 group-hover:w-12" />
    {/* Subtle glow layer */}
    <div className="absolute inset-0 bg-red-600 blur-[4px] opacity-40" />
  </div>
</div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-white text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-center max-w-4xl mx-auto">
            The market doesn't care.<br/>
            <span className="text-zinc-500">Learn before it teaches you.</span>
          </h1>
          
          <p className="text-lg md:text-xl leading-relaxed text-zinc-400 mx-auto max-w-2xl font-light">
            Stop trading on intuition. Deploy institutional-grade intelligence and 
            real-time market reflection. Stay ahead, or stay behind.
          </p>
        </div>

        {/* ⚡ Action Cluster */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <button className="group relative px-8 py-4 bg-white rounded-full text-black font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
            Get Started Free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="px-8 py-4 bg-transparent border border-zinc-800 rounded-full text-white font-bold text-sm uppercase tracking-widest hover:bg-zinc-900 transition-all flex items-center gap-2">
            <Play size={14} fill="currentColor" />
            Watch Demo
          </button>
        </div>
      </div>

      {/* 🖥️ Terminal Preview Component */}
      <div className="mt-24 w-full relative group">
        {/* Decorative Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-2/3 h-64 bg-white/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-900/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            </div>
            {/* <div className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase flex items-center gap-2">
              <Terminal size={12} />
              Terminal_Main_Interface
            </div>
            <div className="w-12" />  */}
          </div>

          {/* Image/Mockup Area */}
          <div className="relative aspect-video bg-zinc-900/50 rounded-b-xl overflow-hidden">
            {/* Replace this div with your actual dashboard screenshot */}
            <div className="absolute inset-0 flex items-center justify-center text-zinc-800 font-mono text-xs uppercase tracking-[0.5em]">
              [ Dashboard Intelligence Preview ]
            </div>
            
            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10 " />
            {/* animate-[scan_4s_linear_infinite]" */}
            
            <img
              src="https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Dashboard Preview"
              className="w-full h-full object-cover grayscale contrast-125 opacity-40 group-hover:opacity-60 transition-opacity duration-700"
            />
          </div>
        </div>

        {/* Floating Stat Decorations */}
        {/* <div className="hidden lg:block absolute -left-12 top-1/2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl animate-bounce [animation-duration:5s]">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Volatility</div>
          <div className="text-xl font-black text-white tracking-tighter">84.2%</div>
        </div>
        <div className="hidden lg:block absolute -right-12 bottom-12 p-4 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl animate-bounce [animation-duration:4s]">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Latency</div>
          <div className="text-xl font-black text-emerald-500 tracking-tighter">12ms</div>
        </div> */}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}