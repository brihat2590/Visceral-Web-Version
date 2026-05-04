"use client";

import React from "react";
import { ArrowRight, Play, Terminal } from "lucide-react";
import Link from "next/link";

export default function HeroContent() {
  return (
    <main className="relative z-[2] mx-auto mt-16 flex max-w-6xl flex-col items-center px-6">
      <div className="group mb-8 flex cursor-default flex-col items-center gap-1">
        <div className="ml-[1.2em] text-[11px] font-black italic uppercase tracking-[1.2em] text-white">
          Visceral
        </div>
        <div className="relative">
          <div className="h-[2px] w-8 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all duration-500 group-hover:w-12" />
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
        <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={"/login"} className="group relative flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95">
            Get Started Free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <button className="flex items-center gap-2 rounded-full border border-zinc-800 bg-transparent px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-900">
            <Play size={14} fill="currentColor" />
            Watch Demo
          </button>
        </div>
      </div>

      <div className="group relative mt-24 w-full">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-2/3 -translate-x-1/2 rounded-full bg-white/5 blur-[120px]" />
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl overflow-hidden backdrop-blur-sm">
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

          <div className="relative aspect-video bg-zinc-900/50 rounded-b-xl overflow-hidden">
            <div className="absolute inset-0 z-10 flex items-center justify-center font-mono text-xs uppercase tracking-[0.5em] text-zinc-800 pointer-events-none">
              [ Dashboard Intelligence Preview ]
            </div>
            <div className="absolute top-0 left-0 z-20 h-[2px] w-full bg-white/10 animate-[scan_4s_linear_infinite]" />
            <img
              src="https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Dashboard Preview"
              className="w-full h-full object-cover grayscale contrast-125 opacity-40 group-hover:opacity-60 transition-opacity duration-700"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </main>
  );
}