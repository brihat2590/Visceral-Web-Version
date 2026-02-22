"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

// import { getOnboardingRedirectPath,getUserOnboardingState } from "@/lib/useNewRedirect";

import { createClient } from "@/lib/supabase/client";

export default  function Login() {
  const router = useRouter();
  const supabase=createClient()
  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

    // try{
    //   const onboarding=await getUserOnboardingState();
    //   setLoading(false);

    //   if(!onboarding){
    //     toast.error("Redirection failed unable to find profile")
    //     return;
    //   }

    //   toast.success("Welcome back!")

    //   setTimeout(()=>{
    //     router.push(getOnboardingRedirectPath(onboarding))
    //   },800)



    // }
    // catch(err){
    //   console.log(err);
    //   toast.error("Redirection failed")
    // }
    setTimeout(()=>{
      router.push("/first-entry")
    })
   
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
    <div className="relative min-h-screen bg-black flex items-center justify-center px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/95 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
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
          {/* Email */}
          <div className="mb-6">
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
          <div className="mb-3">
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
                placeholder="Enter your password"
                className="w-full bg-transparent text-white px-5 py-4 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </div>
          </div>

          {/* Forgot password */}
          <button
            onClick={handleForgotPassword}
            className="w-full text-right text-gray-500 text-sm mb-10 hover:text-gray-400"
          >
            Forgot password?
          </button>
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
            onClick={handleLogin}
            className="w-64 mx-auto mb-8 rounded-xl bg-gradient-to-br from-white to-gray-200 py-6 font-bold text-lg tracking-wider text-black shadow-2xl disabled:opacity-60"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </motion.button>

          <div className="flex justify-center items-center gap-1 text-sm">
            <span className="text-gray-500">Don&apos;t have an account?</span>
            <Link href="/signup" className="text-white font-semibold">
              Create one
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
