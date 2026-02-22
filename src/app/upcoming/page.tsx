"use client";

import { ArrowLeft, EyeClosedIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpgradeScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");

  return (
    <div className="min-h-screen bg-black px-2 py-8 overflow-hidden ">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-end px-6 pt-4">
          <button onClick={() => router.back()}>
            <EyeClosedIcon size={28} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-10">
          {/* Title */}
          <div className="flex items-center  gap-3">

            <ArrowLeft className="text-white pt-2" onClick={()=>{
                router.push('first-entry')
            }}/>
            <h1 className="text-white text-4xl font-bold mt-4 tracking-tight">
                Upgrade to Pro
            </h1>
            
          </div>
          <p className="text-zinc-400 text-lg mt-4 leading-6">
            Unlock advanced intelligence and competitive access to elevate your
            decision making.
          </p>

          {/* Features */}
          <div className="mt-8">
            <FeatureCard
              title="Daily Almanack Access"
              description="Receive structured daily macro insights and market intelligence before the session begins."
            />
            <FeatureCard
              title="Real-Time Guidance"
              description="Get contextual analysis prompts while trading based on evolving market events."
            />
            <FeatureCard
              title="Access to Pro Leagues"
              description="Compete in advanced leagues with structured prize pools and higher caliber participants."
            />
          </div>

          {/* Plan Section */}
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-12 mb-6">
            Select Plan
          </p>

          <div className="flex gap-4">
            {/* Monthly */}
            <button
              onClick={() => setPlan("MONTHLY")}
              className={`flex-1 p-5 rounded-xl bg-zinc-900/30 border transition ${
                plan === "MONTHLY"
                  ? "border-white"
                  : "border-transparent"
              }`}
            >
              <p className="text-zinc-400 text-sm font-medium">Monthly</p>
              <p className="text-white text-xl font-bold mt-1">$4.99</p>
            </button>

            {/* Annual */}
            <button
              onClick={() => setPlan("ANNUAL")}
              className={`relative flex-1 p-5 rounded-xl bg-zinc-900/30 border transition ${
                plan === "ANNUAL"
                  ? "border-white"
                  : "border-transparent"
              }`}
            >
              {plan === "ANNUAL" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-[10px] font-black tracking-wide text-black">
                  BEST VALUE
                </div>
              )}

              <p className="text-zinc-400 text-sm font-medium">Annual</p>
              <p className="text-white text-xl font-bold mt-1">$39.99</p>
            </button>
          </div>

          {/* CTA */}
          <button className="w-full bg-white rounded-xl py-5 mt-12 flex items-center justify-center hover:opacity-90 transition">
            <span className="text-black text-lg font-bold">
              Unlock Pro Access
            </span>
          </button>

          <p className="text-zinc-500 text-center text-xs mt-6">
            {plan === "MONTHLY"
              ? "Billed monthly. Cancel anytime."
              : "Billed annually. Save more with yearly access."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Feature Card */
function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl mb-4">
      <h3 className="text-white text-lg font-semibold mb-2">
        {title}
      </h3>
      <p className="text-zinc-500 text-sm leading-5">
        {description}
      </p>
    </div>
  );
}