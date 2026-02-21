"use client";
import React from "react";

export function VisceralFeaturesSection() {
  return (
    <section className="bg-black py-24 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT — Big hero card */}
        <div className="bg-black border border-white/9  p-10 lg:p-14 flex flex-col justify-between min-h-[480px]">
          <div>
            <h2
              className="text-5xl lg:text-6xl font-black text-white leading-none tracking-tight uppercase mb-8"
              style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}
            >
              WHY VISCERAL
              <br />
              MAKES YOU
              <br />
              BETTER
            </h2>

            <p className="text-white/50 text-base leading-relaxed max-w-sm mb-8">
              Real traders are forged through repetition and reflection — not theory.
              Visceral gives you the arena to do both, risk-free.
            </p>

            <p className="text-white/30 text-sm mb-4">
              Every session you improve through:
            </p>

            <ul className="space-y-3">
              {[
                "Live paper trades on real market prices",
                "AI-graded analysis after every position",
                "Competitive leagues that force discipline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                  <span className="mt-0.5 w-4 h-4 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-2 h-2 text-white/60" fill="none" viewBox="0 0 8 8">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/20 text-xs font-mono mt-10 tracking-widest uppercase">
            No real capital. No excuses.
          </p>
        </div>

        {/* RIGHT — 3 stacked cards */}
        <div className="flex flex-col gap-4">

          {/* Card 1 */}
          <div className="bg-black border border-white/9 rounded-xs p-10">
            <p className="text-white text-lg font-semibold mb-2 leading-snug">
              Trade without fear
            </p>
            <p className="text-white/35 text-sm font-bold mb-3">
              83% of beginner traders blow their account in the first 90 days.*
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              Visceral lets you experience real market volatility, make mistakes,
              and learn — without losing a single rupee.
            </p>
            <p className="text-white/15 text-xs mt-4 font-mono">
              *Source: SEBI retail trader study, 2023
            </p>
          </div>

          {/* Card 2 */}
          <div className=" to-black border border-white/9 rounded-sm p-10">
            <p className="text-white text-lg font-semibold mb-2 leading-snug">
              Compete to stay consistent
            </p>
            <p className="text-white/40 text-sm leading-relaxed mb-3">
              Consistency is what separates profitable traders from gamblers.
              Leagues create the accountability structure to keep you showing up.
            </p>
            <a href="#" className="text-white/60 text-sm underline underline-offset-4 decoration-white/20 hover:text-white transition-colors">
              See how leagues work →
            </a>
          </div>

          {/* Card 3 */}
          <div className="bg-black border border-white/9 rounded-xs p-10">
            <p className="text-white text-lg font-semibold mb-2 leading-snug">
              Our mission
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              We believe financial literacy shouldn't cost money to acquire.
              Visceral is free because the best way to learn is by doing —
              and everyone deserves that chance.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}