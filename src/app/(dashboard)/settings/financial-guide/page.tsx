"use client"

import React, { useState, useMemo } from "react"
import { FINANCIAL_GUIDE_PAGES } from "@/lib/financial-guide-content"
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function FinancialGuide() {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = FINANCIAL_GUIDE_PAGES.length
  const progress = ((currentPage + 1) / totalPages) * 100

  const page = FINANCIAL_GUIDE_PAGES[currentPage]

  const nextPage = () => currentPage < totalPages - 1 && setCurrentPage(prev => prev + 1)
  const prevPage = () => currentPage > 0 && setCurrentPage(prev => prev - 1)

  // Function to render content with LaTeX and proper formatting
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => {
      // Check for formulas and wrap them or format specifically
      if (paragraph.includes('=') && paragraph.length < 200) {
        return (
          <div key={idx} className="my-8 p-6 bg-white/[0.03] border-l-2 border-white rounded-r-xl">
             <p className="text-white/90 font-mono text-lg leading-relaxed italic">
               {paragraph}
             </p>
          </div>
        )
      }
      return (
        <p key={idx} className="mb-6 text-white/70 text-lg leading-relaxed font-normal">
          {paragraph}
        </p>
      )
    })
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto pt-24 pb-32 px-6">
        {/* Header Metadata */}
        <div className="flex items-center gap-4 mb-12">
          <div className="px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50">
            Section {currentPage + 1} of {totalPages}
          </div>
          <div className="h-px flex-1 bg-white/10" />
          <BookOpen size={16} className="text-white/20" />
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-12 leading-[1.1]">
              {page.title.split(': ')[1] || page.title}
            </h1>

            <div className="prose prose-invert max-w-none">
              {renderContent(page.content)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <footer className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold tracking-tight ${
                currentPage === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/10 text-white/50 hover:text-white'
              }`}
            >
              <ChevronLeft size={20} /> Back
            </button>

            <div className="hidden md:flex gap-2">
               {FINANCIAL_GUIDE_PAGES.map((_, i) => (
                 <div 
                  key={i} 
                  className={`h-1 w-4 rounded-full transition-all ${i === currentPage ? 'bg-white w-8' : 'bg-white/10'}`} 
                 />
               ))}
            </div>

            <button 
              onClick={nextPage}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-extrabold hover:bg-neutral-200 transition-all group"
            >
              {currentPage === totalPages - 1 ? "Start Trading" : "Next Chapter"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}