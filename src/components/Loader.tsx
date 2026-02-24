"use client"

import React from "react"

interface VisceralLoaderProps {
  size?: "sm" | "md" | "lg" | number
  className?: string
}

export default function VisceralLoader({ size = "md", className = "" }: VisceralLoaderProps) {
  // Map preset sizes to pixel values if a string is provided
  const sizeMap = {
    sm: 20,
    md: 40,
    lg: 60,
  }

  const dimension = typeof size === "number" ? size : sizeMap[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes visceral-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.2; }
          50% { transform: scaleY(2); opacity: 1; }
        }
        .v-bar {
          width: 2px;
          background-color: white;
          margin: 0 2px;
          animation: visceral-pulse 1s ease-in-out infinite;
        }
        .v-bar:nth-child(2) { animation-delay: 0.2s; }
        .v-bar:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      
      <div 
        className="flex items-center justify-center" 
        style={{ height: dimension, width: dimension }}
      >
        <div className="v-bar" style={{ height: dimension * 0.4 }} />
        <div className="v-bar" style={{ height: dimension * 0.4 }} />
        <div className="v-bar" style={{ height: dimension * 0.4 }} />
      </div>
    </div>
  )
}