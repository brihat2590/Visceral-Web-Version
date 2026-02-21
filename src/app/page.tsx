"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function VisceralLanding() {
  const containerRef = useRef(null);
  
  // Track scroll progress over the height of the hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Scale the circle from a contained shape to 3x its size to "fill" the screen
  const circleScale = useTransform(scrollYProgress, [0, 0.8], [1, 3.5]);
  // Fade out the hero text as the circle expands
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  // Move the dashboard image up as we scroll
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Sticky Container: 
          h-[200vh] creates the scroll length required for the animation.
      */}
      <div ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-start overflow-hidden pt-20">
          
          {/* 1. The Expanding Circle Background */}
          <motion.div 
            style={{ scale: circleScale }}
            className="absolute top-[-10%] w-[1200px] aspect-square rounded-full z-0 pointer-events-none"
            innerref={null}
          >
            {/* The Gradient Fill mimicking your image */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-[#ec4899] opacity-20 blur-[80px]" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/30 to-transparent" />
          </motion.div>

          {/* 2. Hero Text Content */}
          <motion.div 
            style={{ opacity: textOpacity }}
            className="relative z-10 text-center px-6 mt-10"
          >
            <span className="text-zinc-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4 block">
              Visceral Platforms
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
              Learn before the <br /> market teaches you.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto mb-8 font-light leading-relaxed">
              Whimsical-grade simulation for serious traders. Build your edge without the financial friction.
            </p>
            <button className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-3 mx-auto hover:bg-zinc-200 transition-colors">
              Get started free <span className="text-xl">→</span>
            </button>
          </motion.div>

          {/* 3. The Dashboard Preview Image */}
          <motion.div 
            style={{ y: imageY }}
            className="relative z-20 w-full max-w-6xl mt-12 px-6"
          >
            <div className="rounded-t-2xl border-t border-x border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
              {/* Fake Browser UI */}
              <div className="h-10 bg-zinc-800/50 flex items-center px-4 gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
              </div>
              {/* Replace with your actual dashboard screenshot */}
              <div className="bg-zinc-950 aspect-[16/10] flex items-center justify-center">
                <p className="text-zinc-700 font-mono tracking-tighter italic">[Trading Dashboard Interface]</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* The "Next Page" Content:
          This appears as you scroll past the 250vh hero container.
      */}
      <section className="relative z-30 bg-black py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                Capture and share your <br />
                <span className="text-purple-400">trading edge.</span>
              </h2>
              <p className="text-zinc-400 text-xl leading-relaxed">
                Our platform isn't just a simulator; it's a journal, a lab, and a proving ground. 
                Trade global markets with real-time data and zero risk.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
               <FeatureCard title="Diagrams" desc="Visualize market structures and price action." />
               <FeatureCard title="Whiteboards" desc="Plan your entries and exits with precision." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-white/20 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 group-hover:scale-110 transition-transform" />
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-500">{desc}</p>
    </div>
  );
}