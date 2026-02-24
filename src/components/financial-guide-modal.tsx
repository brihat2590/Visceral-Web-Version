"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FINANCIAL_GUIDE_PAGES } from "@/lib/financial-guide-content";

type FinancialGuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function FinancialGuideModal({
  visible,
  onClose,
}: FinancialGuideModalProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Reset page index and scroll when opening
  useEffect(() => {
    if (visible) {
      setPageIndex(0);
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }
  }, [visible]);

  // Reset scroll on page change
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [pageIndex]);

  const currentPage = FINANCIAL_GUIDE_PAGES[pageIndex];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === FINANCIAL_GUIDE_PAGES.length - 1;

  const goToPage = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= FINANCIAL_GUIDE_PAGES.length) return;
    setPageIndex(nextIndex);
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.23, ease: [0.33, 1, 0.68, 1] }} // Cubic ease-out
            className="relative z-10 flex flex-col overflow-hidden border border-neutral-700 bg-[#0A0A0A] rounded-3xl shadow-2xl"
            style={{
              width: "100%",
              maxWidth: "520px",
              height: "100%",
              maxHeight: "780px",
              minHeight: "460px",
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-neutral-800 bg-[#0D0D0D]">
              <div className="flex flex-row items-start justify-between">
                <div className="flex-1 pr-4">
                  <span className="text-neutral-500 text-[10px] font-bold tracking-[2px] block uppercase">
                    VISCERAL FINANCIAL GUIDE
                  </span>
                  <p className="text-neutral-400 text-xs mt-2">
                    Onboarding and Reference
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 transition-colors active:scale-90"
                >
                  ✕
                </button>
              </div>

              <p className="text-neutral-500 text-xs mt-3">
                Page {pageIndex + 1} of {FINANCIAL_GUIDE_PAGES.length}
              </p>
            </div>

            {/* Content (Animated Body) */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="h-full flex flex-col px-5 pt-5"
                >
                  <h2 className="text-white text-xl font-semibold leading-8">
                    {currentPage.title}
                  </h2>

                  <div
                    ref={contentScrollRef}
                    className="flex-1 mt-4 overflow-y-auto no-scrollbar scroll-smooth"
                  >
                    <p className="text-neutral-200 text-[15px] leading-7 pb-6 whitespace-pre-wrap">
                      {currentPage.content}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer / Pagination */}
            <div className="px-5 py-4 border-t border-neutral-800 bg-[#0D0D0D]">
              {/* Dot Indicators */}
              <div className="flex flex-row items-center justify-center space-x-2">
                {FINANCIAL_GUIDE_PAGES.map((page, index) => (
                  <div
                    key={page.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === pageIndex ? "w-5 bg-white" : "w-1.5 bg-neutral-700"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-row items-center justify-between">
                <button
                  onClick={() => goToPage(pageIndex - 1)}
                  disabled={isFirstPage}
                  className={`px-4 py-2.5 rounded-xl border transition-colors font-medium text-sm ${
                    isFirstPage
                      ? "border-neutral-800 bg-neutral-900/40 text-neutral-600 cursor-not-allowed"
                      : "border-neutral-600 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  Back
                </button>

                <button
                  onClick={() => {
                    if (isLastPage) {
                      onClose();
                      return;
                    }
                    goToPage(pageIndex + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors active:scale-95"
                >
                  {isLastPage ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}