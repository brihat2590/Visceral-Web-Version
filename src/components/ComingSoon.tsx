"use client";

import React from "react";
import { Fingerprint } from "lucide-react";

export default function VisceralComingSoon() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden selection:bg-white selection:text-black">
      
      {/* Dynamic Background Noise/Grid */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Pulsing Core */}
        {/* <div className="relative mb-12 group">
          <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-2xl animate-pulse group-hover:opacity-40 transition-opacity" />
          <div className="relative w-24 h-24 rounded-full border border-zinc-800 bg-black flex items-center justify-center backdrop-blur-sm">
            <Fingerprint 
              size={44} 
              strokeWidth={1} 
              className="text-white animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" 
            />
          </div>
        </div> */}

        {/* Brand Header */}
        <div className="text-center space-y-4">
          <h1 className="text-zinc-600 text-[10px] font-bold tracking-[0.8em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
            System Initialization
          </h1>
          
          <div className="overflow-hidden">
            <h2 className="text-6xl md:text-8xl font-medium tracking-tighter animate-in slide-in-from-bottom-full duration-700 ease-out">
              Coming Soon
            </h2>
          </div>

          <p className="text-zinc-400 text-sm font-light italic opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-default">
            Something cool is in the works.
          </p>
        </div>

        {/* Terminal Status Bar */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <div className="flex gap-6 text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">
            <span>Status: Development Phase</span>
            <span className="animate-pulse">●</span>
            <span>Estd 2026</span>
          </div>
        </div>
      </div>

      {/* Decorative Corner Labels */}
      <div className="absolute top-10 left-10 hidden md:block">
        <div className="text-[10px] text-zinc-800 font-mono tracking-widest vertical-rl uppercase">
          Neural_Interface_v0.1
        </div>
      </div>
      
      <div className="absolute bottom-10 right-10 hidden md:block">
        <div className="text-[10px] text-zinc-800 font-mono tracking-widest uppercase">
          [ 40.7128° N, 74.0060° W ]
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        
        .vertical-rl {
          writing-mode: vertical-rl;
        }
      `}</style>
    </div>
  );
}