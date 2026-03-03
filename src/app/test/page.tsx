"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserOnboardingState, getOnboardingRedirectPath } from "@/lib/supabase/onBoarding";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Mirrors handleForgotPassword() in your mobile login.tsx
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email first",
      });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error("Reset failed", { description: error.message });
      return;
    }

    toast.success("Password reset sent", {
      description: "Check your email to reset your password",
    });
  };

  // Mirrors handleLogin() in your mobile login.tsx — exact same logic
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Missing fields", {
        description: "Please enter email and password",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error("Login failed", { description: error.message });
      return;
    }

    try {
      const onboarding = await getUserOnboardingState(supabase);
      setLoading(false);

      if (!onboarding) {
        toast.error("Login error", { description: "Unable to load profile" });
        return;
      }

      toast.success("Welcome back", { description: "Login successful" });

      // mirrors setTimeout(() => router.replace(...), 800)
      setTimeout(() => {
        router.push(getOnboardingRedirectPath(onboarding));
      }, 800);
    } catch {
      setLoading(false);
      toast.error("Profile error", {
        description: "Unable to determine onboarding state",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* LinearGradient overlay — mirrors colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]} */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10">

        {/* Brand — mirrors FadeInDown.duration(800).springify() + tracking-[8px] text-2xl font-light */}
        <div className="flex flex-col items-center mb-16 animate-fade-in-down">
          <span className="text-white tracking-[8px] text-2xl font-light mb-2">
            VISCERAL
          </span>
          <div className="h-px w-20 bg-white/30" />
        </div>

        {/* Form — mirrors FadeInUp.delay(200).duration(800).springify() */}
        <div className="animate-fade-in-up opacity-0">

          {/* Email Field — mirrors animated border on focus */}
          <div className="mb-6">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Email Address
            </label>
            <div
              className="rounded-xl bg-white/5 overflow-hidden transition-all duration-200"
              style={{
                border: emailFocused
                  ? "2px solid rgba(255,255,255,0.8)"
                  : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className="w-full bg-transparent text-white text-base px-5 py-4 outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Password Field — mirrors animated border on focus */}
          <div className="mb-3">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3 ml-1">
              Password
            </label>
            <div
              className="rounded-xl bg-white/5 overflow-hidden transition-all duration-200"
              style={{
                border: passwordFocused
                  ? "2px solid rgba(255,255,255,0.8)"
                  : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-transparent text-white text-base px-5 py-4 outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Forgot Password — mirrors FluidPressable onPress={handleForgotPassword} */}
          <div className="mb-10 flex justify-end">
            <button
              onClick={handleForgotPassword}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors active:scale-95"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* CTA — mirrors FadeInUp.delay(400).duration(800).springify() */}
        <div className="animate-fade-in-up-400 opacity-0">
          {/* Sign in button — mirrors LinearGradient colors={["#ffffff", "#e5e5e5"]} */}
          <div className="flex justify-center mb-8">
            <button
              disabled={loading}
              onClick={handleLogin}
              className="w-64 rounded-xl overflow-hidden shadow-2xl active:scale-95 transition-transform duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)",
              }}
            >
              <div className="py-6 flex items-center justify-center">
                <span className="text-black font-bold text-lg tracking-wider">
                  {loading ? "SIGNING IN..." : "SIGN IN"}
                </span>
              </div>
            </button>
          </div>

          {/* Sign Up link — mirrors FadeIn.delay(600).duration(1000) */}
          <div className="animate-fade-in-600 opacity-0 flex flex-row justify-center items-center">
            <span className="text-gray-500 text-sm">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="text-white font-semibold text-sm hover:text-gray-200 transition-colors ml-1"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}