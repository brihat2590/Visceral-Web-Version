"use client"

import React, { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import VisceralLoader from "@/components/Loader"

type AlmanackEntry = {
  key: string;
  marketDate: string;
  analysis: string;
  intuitionScore: number | null;
};

// ─── Grain overlay for texture ───────────────────────────────────────────────
function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-screen" aria-hidden>
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
  const accentColor = score > 70 ? "#4ade80" : score > 40 ? "#facc15" : "#f87171"

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
      className="group py-10 border-t border-white/[0.06] hover:border-white/[0.12] transition-colors duration-500"
    >
      <div className="flex items-start justify-between gap-10">

        {/* Left: text content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: accentColor }}>
              {entryNum}
            </span>
            <span className="text-white/70 text-[12px] font-medium uppercase tracking-[0.2em]">{formattedDate}</span>
          </div>

          {/* Analysis */}
          <p className="text-white/70 text-xl md:text-xl leading-[1.6]  tracking-tight group-hover:text-white/85 transition-colors duration-500">
            {entry.analysis}
          </p>
        </div>

        {/* Right: score */}
        {entry.intuitionScore !== null && (
          <div className="flex-none flex flex-col items-end gap-1 pt-1">
            <h1 className="p-2 text-white/70 text-[12px] font-medium uppercase tracking-[0.2em">Intuition Score</h1>
            <motion.span
              className="text-5xl font-black tracking-tighter tabular-nums"
              style={{ color: accentColor }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {score}
            </motion.span>
            <div className="w-10 h-[2px] rounded-full overflow-hidden bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
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
    <div className="flex h-screen items-center justify-center bg-[#060606]">
      <GrainOverlay />
      <div className="flex flex-col items-center gap-6">
        <VisceralLoader size="lg" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-4">Consulting Archives</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060606] text-white selection:bg-white selection:text-black">
      <GrainOverlay />

      {/* Ambient top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 70%)" }}
      />

      {/* ── Header ── */}
      <header className="max-w-5xl mx-auto px-8 pt-20 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-8 mb-16"
        >
          {/* Title */}
          <div>
            <h1
              className="font-black leading-none tracking-[-0.05em] text-[clamp(60px,10vw,100px)]"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.3) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Almanack
            </h1>
          </div>

          {/* Inline stats + search */}
          <div className="flex items-center gap-8 pb-2">
            {entries.length > 0 && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">Entries</p>
                  <p className="text-2xl font-black tracking-tighter text-white/60">{entries.length.toString().padStart(3, "0")}</p>
                </div>
                {avgScore !== null && (
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">Avg Score</p>
                    <p className="text-2xl font-black tracking-tighter text-white/60">{Math.round(avgScore)}</p>
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
          className="relative mb-2"
        >
          <Search
            size={14}
            className="absolute left-0 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: focused ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)" }}
          />
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-6 pr-8 py-2 text-sm text-white/60 placeholder:text-white/15 outline-none border-b transition-all duration-200"
            style={{ borderColor: focused ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)" }}
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchTerm("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-lg leading-none"
              >
                ×
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* ── Entries ── */}
      <main className="max-w-5xl mx-auto px-8 pb-32">
        <AnimatePresence mode="wait">
          {filteredEntries.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              className="mt-16 py-28 flex flex-col items-center justify-center text-center"
            >
              <p className="text-white/30 font-semibold text-base mb-2">
                {searchTerm ? "No matching entries" : "The archive is empty"}
              </p>
              <p className="text-white/15 text-sm max-w-xs leading-relaxed">
                {searchTerm
                  ? "Try a different search term."
                  : "Execute trades to generate behavioral analysis entries."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 hover:text-white/45 transition-colors"
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