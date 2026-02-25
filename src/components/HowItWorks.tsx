"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────
   STEP DATA
───────────────────────────────────────── */
const steps = [
  {
    id: "signup",
    number: "01",
    label: "Sign Up & Explore",
    headline: "Zero capital.\nFull market access.",
    description:
      "Create your account in under 60 seconds. Get $100,000 in virtual capital and immediate access to equities, crypto, and forex. No KYC. No deposits. Just trade.",
    tags: ["FREE ACCOUNT", "INSTANT ACCESS", "$100K VIRTUAL"],
    visual: <SignupVisual />,
  },
  {
    id: "leagues",
    number: "02",
    label: "Join Leagues & Trade",
    headline: "Compete. Execute.\nDominate.",
    description:
      "Join public leagues or create private ones with friends. Execute paper trades on live market data. Real-time P&L, leaderboards, and weekly tournaments.",
    tags: ["LIVE PRICES", "PRIVATE LEAGUES", "REAL-TIME P&L"],
    visual: <LeagueVisual />,
  },
  {
    id: "reflect",
    number: "03",
    label: "Reflect & Improve",
    headline: "Every trade.\nBreakdown.",
    description:
      "After every trade, Visceral's Almanack AI dissects your decision — entry timing, emotional bias, risk sizing. Get a grade. Get better. Repeat.",
    tags: ["AI ANALYSIS", "TRADE GRADES", "PATTERN DETECTION"],
    visual: <ReflectVisual />,
  },
];

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export function HowItWorksSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative bg-black py-24 lg:py-40 overflow-hidden">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 mb-14 text-center">
        {/* <p className="text-[10px] uppercase tracking-[0.4em] text-white/25 font-mono mb-4">
          The Process
        </p> */}

<div className="flex flex-col items-center gap-1 group cursor-default">
  {/* The Text: High tracking, bold, and italic for that aggressive look */}
  <div className="text-[11px] font-black italic tracking-[1.2em] text-white uppercase ml-[1.2em]">
    The Process
  </div>
  
  {/* The Accent: A sharp red bar that matches your brand image */}
  <div className="relative">
    <div className="h-[2px] w-8 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all duration-500 group-hover:w-12" />
    {/* Subtle glow layer */}
    <div className="absolute inset-0 bg-red-600 blur-[4px] opacity-40" />
  </div>
</div>
        <h2
          className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none"
        //   style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}
        >
          HOW IT WORKS
        </h2>
        <p className="mt-4 text-sm text-white/35 font-mono max-w-md mx-auto leading-relaxed">
          Three steps from zero to elite paper trader.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 mb-10">
        <div className="flex justify-center">
          <div className="inline-flex border border-white/10 rounded-sm p-1 gap-1 bg-white/[0.02]">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActive(i)}
                className={cn(
                  "relative px-5 py-2.5 text-xs font-mono tracking-[0.15em] uppercase transition-all duration-300 rounded-sm",
                  active === i
                    ? "text-black"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                {active === i && (
                  <motion.div
                    layoutId="pill"
                    className="absolute inset-0 bg-white rounded-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="opacity-50">{step.number}</span>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Panel */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border border-white/10 rounded-sm overflow-hidden bg-white/[0.01]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px]"
            >
              {/* Left: Text */}
              <div className="flex flex-col justify-between p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-[9px] font-mono tracking-[0.3em] text-white/20 border border-white/10 px-2 py-1 rounded-sm">
                      STEP {steps[active].number}
                    </span>
                  </div>

                  <h3
                    className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tighter whitespace-pre-line mb-6"
                    // style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}
                  >
                    {steps[active].headline}
                  </h3>

                  <p className="text-sm text-white/45 font-mono leading-relaxed max-w-sm">
                    {steps[active].description}
                  </p>
                </div>

                {/* Tags + Step indicators */}
                <div className="mt-10 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {steps[active].tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono tracking-[0.2em] text-white/40 border border-white/10 px-2.5 py-1 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-3">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={cn(
                          "transition-all duration-300 rounded-sm",
                          active === i
                            ? "w-8 h-1 bg-white"
                            : "w-3 h-1 bg-white/20 hover:bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Visual */}
              <div className="relative flex items-center justify-center p-8 lg:p-10 bg-white/[0.01] overflow-hidden">
                {/* Corner marks */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-white/15" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-white/15" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-white/15" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-white/15" />

                <div className="w-full max-w-sm">
                  {steps[active].visual}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   VISUAL 1 — SIGNUP & EXPLORE
   Mock onboarding + portfolio setup
───────────────────────────────────────── */
function SignupVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2100),
      setTimeout(() => setStep(4), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const fields = [
    { label: "Username", value: "apex__void", done: step >= 1 },
    { label: "Email", value: "trader@visceral.io", done: step >= 2 },
    { label: "Password", value: "••••••••••", done: step >= 3 },
  ];

  return (
    <div className="font-mono text-xs space-y-3">
      {/* Header */}
      <div className="border border-white/10 rounded-sm px-4 py-3 bg-white/[0.02] flex items-center justify-between">
        <span className="text-white font-black tracking-wider text-sm">VISCERAL</span>
        <span className="text-[9px] text-white/25 tracking-widest">CREATE ACCOUNT</span>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {fields.map((f) => (
          <div
            key={f.label}
            className={cn(
              "border rounded-sm px-4 py-3 flex items-center justify-between transition-all duration-500",
              f.done ? "border-white/25 bg-white/[0.03]" : "border-white/8 bg-transparent"
            )}
          >
            <span className="text-white/25 text-[9px] tracking-widest uppercase">{f.label}</span>
            {f.done ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70"
              >
                {f.value}
              </motion.span>
            ) : (
              <span className="w-20 h-2 bg-white/5 rounded-sm" />
            )}
          </div>
        ))}
      </div>

      {/* Capital card */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-white rounded-sm p-5 bg-white/[0.04] mt-2"
          >
            <p className="text-[9px] text-white/30 tracking-[0.2em] mb-2">STARTING CAPITAL</p>
            <p
              className="text-4xl font-black text-white tracking-tighter"
              style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}
            >
              $100,000
            </p>
            <p className="text-[9px] text-white/30 mt-1 tracking-wider">VIRTUAL · PAPER TRADING</p>
            <div className="mt-3 flex gap-2">
              {["EQUITIES", "CRYPTO", "FOREX"].map((m) => (
                <span key={m} className="text-[8px] text-white/40 border border-white/10 px-2 py-0.5 rounded-sm">
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   VISUAL 2 — LEAGUES & TRADE
   Mock league + live trade execution
───────────────────────────────────────── */
function LeagueVisual() {
  const [price, setPrice] = useState(248.30);
  const [executed, setExecuted] = useState(false);
  const [ticks, setTicks] = useState<number[]>([248.30]);

  useEffect(() => {
    setPrice(248.30);
    setExecuted(false);
    setTicks([248.30]);

    const priceId = setInterval(() => {
      setPrice((p) => {
        const n = p + (Math.random() - 0.48) * 0.6;
        setTicks((t) => [...t.slice(-30), n]);
        return n;
      });
    }, 500);

    const execId = setTimeout(() => setExecuted(true), 2000);
    return () => { clearInterval(priceId); clearTimeout(execId); };
  }, []);

  const traders = [
    { name: "apex__void", pnl: "+$3,210", rank: 1 },
    { name: "you", pnl: "+$1,840", rank: 2, isYou: true },
    { name: "mktmaker9", pnl: "+$990", rank: 3 },
  ];

  const max = Math.max(...ticks);
  const min = Math.min(...ticks);
  const range = max - min || 1;

  return (
    <div className="font-mono text-xs space-y-3">
      {/* League badge */}
      <div className="border border-white/15 rounded-sm px-4 py-3 flex items-center justify-between bg-white/[0.02]">
        <div>
          <p className="text-[9px] text-white/25 tracking-widest mb-0.5">ACTIVE LEAGUE</p>
          <p className="text-white font-black tracking-wide">WOLF PACK #14</p>
        </div>
        <span className="text-[9px] text-white/40 border border-white/10 px-2 py-1 rounded-sm">
          6 TRADERS
        </span>
      </div>

      {/* Live chart */}
      <div className="border border-white/10 rounded-sm overflow-hidden bg-black">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-white/50 text-[10px]">TSLA · LIVE</span>
          <span className="text-white font-black">${price.toFixed(2)}</span>
        </div>
        <div className="px-3 pt-3 pb-2 flex items-end gap-px h-16">
          {ticks.map((t, i) => {
            const h = Math.max(3, ((t - min) / range) * 44);
            const isLast = i === ticks.length - 1;
            return (
              <div
                key={i}
                className={cn("flex-1 rounded-sm transition-all duration-300", isLast ? "bg-white" : "bg-white/30")}
                style={{ height: h }}
              />
            );
          })}
        </div>
      </div>

      {/* Execute button */}
      <motion.div
        animate={executed ? { borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.06)" } : {}}
        className="border border-white/10 rounded-sm px-4 py-3 flex items-center justify-between cursor-pointer"
      >
        <div>
          <p className="text-[9px] text-white/25 mb-0.5">BUY MARKET</p>
          <p className="text-white font-black">100 × TSLA</p>
        </div>
        {executed ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] text-white border border-white/30 px-2 py-1 rounded-sm font-black tracking-widest"
          >
            FILLED ✓
          </motion.span>
        ) : (
          <span className="text-[9px] text-white/30 border border-white/10 px-2 py-1 rounded-sm">
            PENDING
          </span>
        )}
      </motion.div>

      {/* Mini leaderboard */}
      <div className="border border-white/10 rounded-sm overflow-hidden">
        {traders.map((t) => (
          <div
            key={t.name}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0",
              t.isYou && "bg-white/[0.04]"
            )}
          >
            <span className="text-white/25 w-4">#{t.rank}</span>
            <span className={cn("flex-1 ml-3", t.isYou ? "text-white font-black" : "text-white/40")}>
              {t.name}
            </span>
            <span className={cn("font-black", t.pnl.startsWith("+") ? "text-white" : "text-white/30")}>
              {t.pnl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   VISUAL 3 — REFLECT
   Almanack trade analysis
───────────────────────────────────────── */
function ReflectVisual() {
  const [line, setLine] = useState(0);

  const lines = [
    {
      text: "The AI reviews every trade you make, analyzing decision quality, risk discipline, and behavioral patterns. It highlights emotional bias, missed structure, and execution flaws—then delivers clear, actionable guidance to help you trade with consistency, control, and conviction.",
      dim: false,
      highlight: true,
    },
  ];

  useEffect(() => {
    setLine(0);
    lines.forEach((_, i) => {
      setTimeout(() => setLine(i + 1), 400 + i * 700);
    });
  }, []);

  const grades = [
    { label: "Entry Timing", grade: "B+", score: 72 },
    { label: "Risk Control", grade: "A−", score: 88 },
    { label: "Emotion Score", grade: "C+", score: 46 },
    { label: "Exit Quality", grade: "B", score: 68 },
  ];

  return (
    <div className="font-mono text-xs space-y-3">
      {/* Terminal */}
      <div className="border border-white/10 rounded-sm bg-black overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
          <span className="text-[9px] tracking-[0.25em] text-white/25">ALMANACK · AI ANALYSIS</span>
          <span className="ml-auto flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
          </span>
        </div>
        <div className="p-4 min-h-[110px]">
  {lines.slice(0, line).map((l, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "leading-relaxed text-sm",
        l.highlight
          ? "text-white font-medium"
          : l.dim
          ? "text-white/30"
          : "text-white/60"
      )}
    >
      {l.text}
    </motion.div>
  ))}

  {/* Subtle cursor pulse (kept, but visually appropriate for paragraph) */}
  {line < lines.length && (
    <span className="inline-block mt-2 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
  )}
</div>
      </div>

      {/* Grade bars */}
      <div className="grid grid-cols-2 gap-2">
        {grades.map((g, i) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: line >= 3 ? 1 : 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-white/10 rounded-sm p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-white/25 tracking-wider uppercase leading-tight">{g.label}</span>
              <span className="text-sm font-black text-white">{g.grade}</span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: line >= 3 ? `${g.score}%` : 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                className="h-full bg-white/60 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall card */}
      <AnimatePresence>
        {line >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white rounded-sm px-4 py-3 flex items-center justify-between bg-white/[0.03]"
          >
            <div>
              <p className="text-[9px] text-white/30 tracking-[0.2em] mb-0.5">OVERALL TRADE SCORE</p>
              <p className="text-[10px] text-white/40">Improve emotional control to reach A.</p>
            </div>
            <span
              className="text-3xl font-black text-white"
              style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}
            >
              B+
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}