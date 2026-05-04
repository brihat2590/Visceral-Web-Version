"use client";
import React from "react";

export function VisceralFeaturesSection() {
  return (
    <section className="bg-black px-6 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-[480px] flex-col justify-between border border-white bg-black p-10 lg:p-14">
          <div>
            <h2 className="mb-8 text-5xl font-black uppercase leading-none tracking-tight text-white lg:text-6xl" style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}>
              WHY VISCERAL
              <br />
              MAKES YOU
              <br />
              BETTER
            </h2>

            <p className="mb-8 max-w-sm text-base leading-relaxed text-white/50">
              Real traders are forged through repetition and reflection — not theory.
              Visceral gives you the arena to do both, risk-free.
            </p>

            <p className="mb-4 text-sm text-white/30">
              Every session you improve through:
            </p>

            <ul className="space-y-3">
              {[
                "Live paper trades on real market prices",
                "AI-graded analysis after every position",
                "Competitive leagues that force discipline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20">
                    <svg className="h-2 w-2 text-white/60" fill="none" viewBox="0 0 8 8">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 text-xs font-mono uppercase tracking-widest text-white/20">
            No real capital. No excuses.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-sm border border-white bg-black p-10">
            <p className="mb-2 text-lg font-semibold leading-snug text-white">
              Trade without fear
            </p>
            <p className="mb-3 text-sm font-bold text-white/35">
              83% of beginner traders blow their account in the first 90 days.*
            </p>
            <p className="text-sm leading-relaxed text-white/40">
              Visceral lets you experience real market volatility, make mistakes,
              and learn — without losing a single rupee.
            </p>
            <p className="mt-4 text-xs font-mono text-white/15">
              *Source: SEBI retail trader study, 2023
            </p>
          </div>

          <div className="rounded-sm border border-white bg-black p-10">
            <p className="mb-2 text-lg font-semibold leading-snug text-white">
              Compete to stay consistent
            </p>
            <p className="mb-3 text-sm leading-relaxed text-white/40">
              Consistency is what separates profitable traders from gamblers.
              Leagues create the accountability structure to keep you showing up.
            </p>
            <a href="#" className="text-sm text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white">
              See how leagues work →
            </a>
          </div>

          <div className="rounded-sm border border-white bg-black p-10">
            <p className="mb-2 text-lg font-semibold leading-snug text-white">
              Our mission
            </p>
            <p className="text-sm leading-relaxed text-white/40">
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