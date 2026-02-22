"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Missing fields", {
        description: "Please enter email and password",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error("Login failed", {
        description: error.message,
      });
      return;
    }

    setLoading(false);
    toast.success("Welcome back", {
      description: "Login successful",
    });

    setTimeout(() => {
      router.push("/first-entry");
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email first",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Reset failed", {
        description: error.message,
      });
      return;
    }

    toast.success("Password reset sent", {
      description: "Check your email to reset your password",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row font-sans">
      
      {/* Left Section: Branding and Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-24 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full mx-auto lg:mx-0"
        >
          <h2 className="tracking-[0.4em] text-zinc-500 text-xs font-medium uppercase mb-8">
            VISCERAL
          </h2>
          <h1 className="text-4xl font-semibold mb-4 tracking-tight">Log in</h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-12 max-w-[280px]">
            Risk-free paper trading with competitive leagues and an Almanack that mirrors your behavior.
          </p>

          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {/* CTA Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={handleLogin}
              className="w-full bg-white text-black font-bold py-4 rounded-lg mt-4 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </motion.button>

            {/* Secondary Links */}
            <div className="space-y-3 pt-4">
              <button 
                onClick={handleForgotPassword}
                className="block text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
              >
                Forgot password?
              </button>
              <Link 
                href="/signup" 
                className="block text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
              >
                Create free account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Section: Visual Insight */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-24 border-l border-white/5 bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h3 className="text-xl font-medium mb-2 leading-snug max-w-xs">
            The market is indifferent. Your reactions are not.
          </h3>
          <p className="text-zinc-500 text-sm mb-12 max-w-sm">
            Visceral tracks your entries, exits, and hesitation in real time, then feeds them back through your Almanack.
          </p>

          {/* Behavior Snapshot Card */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-8 mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block mb-4">
              Behavior Snapshot
            </span>
            <h4 className="text-2xl font-medium mb-3">
              Last 30 trades · 64% executed on plan
            </h4>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
              Log in to continue your current league and extend this track record, risk-free.
            </p>
          </div>

          {/* Abstract Grid Graphic */}
          {/* Abstract Grid Graphic */}
          <div className="relative h-48 w-full border border-white/5 overflow-hidden">
             {/* The Grid: Changed from dark zinc to white/5 for a subtle mesh look */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
             
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                {/* The Graph Path: Set stroke to pure white and increased width slightly */}
                <path 
                  d="M0 160 Q 50 150, 100 170 T 200 140 T 300 180 T 400 150" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1"
                  className="opacity-80"
                />
                {/* Optional: Second subtle line for "depth" seen in some trading UIs */}
                <path 
                  d="M0 140 Q 60 130, 120 150 T 240 120 T 360 160 T 400 130" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeWidth="0.5"
                />
             </svg>
          </div>
        </motion.div>
      </div>

    </div>
  );
}