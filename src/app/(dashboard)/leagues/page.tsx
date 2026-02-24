"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ComingSoon = () => {
  return (
    // SafeAreaView equivalent: min-h-screen with flex centering
    <div className="min-h-screen bg-black flex items-center justify-center p-5 overflow-hidden font-sans">
      
      {/* Animated.View equivalent using Framer Motion */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for a "refined" feel
        }}
        className="flex flex-col items-center"
      >
        {/* Title */}
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-[0.3em] text-center">
          COMING SOON
        </h1>
        
        {/* Line Divider */}
        <div className="w-12 h-[2px] bg-white my-8" />
        
        {/* Subtitle */}
        <p className="text-zinc-500 text-xs md:text-sm tracking-[0.2em] text-center uppercase">
          Something refined is in the works.
        </p>
        
        {/* Footer */}
        <div className="mt-20">
          <span className="text-zinc-800 text-[10px] tracking-[0.4em] font-semibold">
            EST. 2026
          </span>
        </div>
        
      </motion.div>
    </div>
  );
};

export default ComingSoon;