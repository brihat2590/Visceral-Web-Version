"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import  {toast}  from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;

    if (!username || !email || !password || !confirmPassword) {
      toast.error("Missing fields", {
        description: "Please fill all fields",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password mismatch", {
        description: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        toast.error("Sign up failed", {
          description: error.message,
        });
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
        toast.error("Profile creation failed", {
          description: insertError.message,
        });
        return;
      }

      toast.success("Account created", {
        description: "Check your email to verify your account",
      });

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/95 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-white tracking-[8px] text-2xl font-light mb-2">
            VISCERAL
          </h1>
          <div className="h-px w-20 bg-white/30 mx-auto" />
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {/* Username */}
          <div className="mb-5">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Username
            </label>
            <div
              className={`rounded-xl bg-white/5 transition-all ${
                usernameFocused
                  ? "border-2 border-white/80"
                  : "border border-white/20"
              }`}
            >
              <input
                type="text"
                placeholder="Choose a username"
                className="w-full bg-transparent text-white px-5 py-4 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Email Address
            </label>
            <div
              className={`rounded-xl bg-white/5 transition-all ${
                emailFocused
                  ? "border-2 border-white/80"
                  : "border border-white/20"
              }`}
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full bg-transparent text-white px-5 py-4 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Password
            </label>
            <div
              className={`rounded-xl bg-white/5 transition-all ${
                passwordFocused
                  ? "border-2 border-white/80"
                  : "border border-white/20"
              }`}
            >
              <input
                type="password"
                placeholder="Create a password"
                className="w-full bg-transparent text-white px-5 py-4 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-10">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Confirm Password
            </label>
            <div
              className={`rounded-xl bg-white/5 transition-all ${
                confirmPasswordFocused
                  ? "border-2 border-white/80"
                  : "border border-white/20"
              }`}
            >
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full bg-transparent text-white px-5 py-4 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleSignUp}
            className="w-64 mx-auto mb-8 rounded-xl bg-gradient-to-br from-white to-gray-200 py-6 font-bold text-lg tracking-wider text-black shadow-2xl disabled:opacity-60"
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </motion.button>

          <div className="flex justify-center items-center gap-1 text-sm">
            <span className="text-gray-500">Already have an account?</span>
            <Link href="/login" className="text-white font-semibold">
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
