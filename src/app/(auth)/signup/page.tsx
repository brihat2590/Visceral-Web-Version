"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (loading) return;

    if (!username || !email || !password || !confirmPassword) {
      toast.error("Missing fields", { description: "Please fill all fields" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password mismatch", { description: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        toast.error("Sign up failed", { description: error.message });
        return;
      }

      const user = data.user;
      if (!user) {
        toast.error("User creation failed");
        return;
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        username,
        available_balance: 100000,
        current_streak: 0,
        trader_days: 0,
        created_at: new Date(),
      });

      if (insertError) {
        toast.error("Profile creation failed", { description: insertError.message });
        return;
      }

      toast.success("Account created", { description: "Check your email to verify your account" });

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      toast.error("Something went wrong", { description: "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row items-center justify-center p-6 lg:p-24 font-sans">
      
      {/* Left Side: Branding and Info */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center mb-12 lg:mb-0 lg:pr-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="tracking-[0.4em] text-zinc-500 text-xs font-medium uppercase mb-8">
            VISCERAL
          </h2>
          <h1 className="text-4xl lg:text-5xl font-semibold mb-6 tracking-tight">
            Create your Visceral account
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
            Risk-free paper trading, reflective Almanack, and disciplined competitive leagues in a controlled environment.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Form Card */}
      <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full max-w-[480px] bg-[#0A0A0A] border border-white/5 rounded-xl p-8 lg:p-12"
        >
          <div className="space-y-7">
            {/* Username */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-[#0F0F0F] border-none rounded-md py-4 px-4 text-neutral-300 placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-700 outline-none transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0F0F0F] border-none rounded-md py-4 px-4 text-zinc-300 placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-700 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F0F0F] border-none rounded-md py-4 px-4 text-zinc-300 placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-700 outline-none transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Confirm Password
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                placeholder="••••••••"
                className="w-full bg-[#0F0F0F] border-none rounded-md py-4 px-4 text-zinc-300 placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-700 outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-zinc-200 transition-colors mt-4 text-sm disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create free account"}
            </motion.button>

            {/* Login Link */}
            <p className="text-center text-zinc-500 text-sm mt-6">
              Already have an account? <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">Login</Link>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}