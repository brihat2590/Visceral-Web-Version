"use client"

import React, { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type AlmanackEntry = {
  key: string;
  marketDate: string;
  analysis: string;
  intuitionScore: number | null;
};

// ─── Grain overlay for texture ───────────────────────────────────────────────
function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-50 opacity-[0.01] mix-blend-screen" aria-hidden>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  )
}

// ─── Individual archive card ──────────────────────────────────────────────────
function ArchiveCard({ entry, index }: { entry: AlmanackEntry; index: number }) {
  const score = entry.intuitionScore ?? 0
  const accentColor = "#ffffff"
  const formattedAnalysis = entry.analysis.replace(/\s+(?=\d+\.\s)/g, "\n")

  const formattedDate = new Date(entry.marketDate).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  const entryNum = (index + 1).toString().padStart(3, "0")

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group px-0 py-8 transition-opacity duration-200 sm:py-9"
    >
      <div className="flex items-start justify-between gap-6 border-t border-white/[0.06] pt-8 first:border-t-0 first:pt-0">

        {/* Left: text content */}
        <div className="flex-1 min-w-0 pl-2 sm:pl-4">
          {/* Meta row */}
          <div className="mb-5 flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: accentColor }}>
              {entryNum}
            </span>
            <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/42">{formattedDate}</span>
          </div>

          {/* Analysis */}
          <p className="max-w-[78ch] whitespace-pre-line text-[17px] leading-[1.9] tracking-[-0.01em] text-white/72 transition-colors duration-200 group-hover:text-white/88 md:text-[18px]">
            {formattedAnalysis}
          </p>
        </div>

        {/* Right: score */}
        {entry.intuitionScore !== null && (
          <div className="flex-none flex flex-col items-end gap-2 pt-1">
            <h1 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">Score</h1>
            <motion.span
              className="text-4xl font-black leading-none tracking-[-0.08em] tabular-nums sm:text-5xl"
              style={{ color: accentColor }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {score}
            </motion.span>
            <div className="h-px w-12 overflow-hidden bg-white/[0.08]">
              <motion.div
                className="h-full"
                style={{ background: accentColor }}
                initial={{ width: 0 }}
                whileInView={{ width: `${score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}



// ─── Main page ────────────────────────────────────────────────────────────────
export default function AlmanackArchivePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<AlmanackEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [focused, setFocused] = useState(false)

  const fetchArchive = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from("auto_almanack")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setEntries(
        data.map((item) => ({
          key: String(item.id),
          marketDate: item.market_date || item.created_at.split("T")[0],
          analysis: item.system_analysis || item.analysis || "",
          intuitionScore: item.intuition_score,
        })).filter(i => i.analysis)
      )
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchArchive() }, [fetchArchive])

  const filteredEntries = entries.filter(e =>
    e.analysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.marketDate.includes(searchTerm)
  )

  const avgScore = entries.filter(e => e.intuitionScore !== null).length > 0
    ? entries.reduce((s, e) => s + (e.intuitionScore ?? 0), 0) / entries.filter(e => e.intuitionScore !== null).length
    : null

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-black">
      <GrainOverlay />
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border border-white/5" />
          <div className="absolute inset-0 rounded-full border-t border-white/40 animate-spin" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/20">Consulting Archives</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <GrainOverlay />

      {/* ── Header ── */}
      <header className="mx-auto max-w-6xl px-5 pb-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between"
        >
          {/* Title */}
          <div className="max-w-2xl">
            <h1
              className="text-[clamp(56px,9vw,92px)] font-black leading-none  text-white"
            >
              Almanack
            </h1>
          </div>

          {/* Inline stats + search */}
          <div className="flex items-center gap-8 pb-2">
            {entries.length > 0 && (
              <div className="hidden items-center gap-6 md:flex">
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-white/18">Entries</p>
                  <p className="text-2xl font-black leading-none tracking-[-0.07em] text-white/78">{entries.length.toString().padStart(3, "0")}</p>
                </div>
                {avgScore !== null && (
                  <div className="text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-white/18">Avg Score</p>
                    <p className="text-2xl font-black leading-none tracking-[-0.07em] text-white/78">{Math.round(avgScore)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-2 px-0 py-3"
        >
          <Search
            size={14}
            className="absolute left-0 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: focused ? "rgba(247,248,248,0.45)" : "rgba(247,248,248,0.18)" }}
          />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-5 pr-8 py-1.5 text-[15px] font-medium tracking-[-0.02em] text-white/76 placeholder:text-white/15 outline-none transition-all duration-200"
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchTerm("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-lg leading-none text-white/20 transition-colors hover:text-white/45"
              >
                ×
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* ── Entries ── */}
      <main className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {filteredEntries.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              {filteredEntries.map((entry, index) => (
                <ArchiveCard key={entry.key} entry={entry} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-16 flex flex-col items-center justify-center py-28 text-center"
            >
              <p className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-white/32">
                {searchTerm ? "No matching entries" : "The archive is empty"}
              </p>
              <p className="max-w-xs text-[13px] leading-[1.8] tracking-[-0.01em] text-white/16">
                {searchTerm
                  ? "Try a different search term."
                  : "Execute trades to generate behavioral analysis entries."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 transition-colors hover:text-white/42"
                >
                  Clear filter
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}