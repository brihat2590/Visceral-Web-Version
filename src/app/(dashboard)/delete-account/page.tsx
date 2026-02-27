"use client";

import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ FIX #6 — was missing

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const HOME_CACHE_KEY_PREFIX = "first_entry_home_cache_v1";
const WATCHLIST_CACHE_KEY_PREFIX = "watchlist_cache_v1";
const SOCIAL_CACHE_KEY_PREFIX = "social_screen_cache_v1";
const USER_PROFILE_CACHE_KEY_PREFIX = "user_profile_screen_cache_v1";

// ✅ FIX #5 — added "error" stage
type DeleteStage = "deleting" | "deleted" | "error";

function getUserCacheKeys(userId: string) {
  return [
    `${HOME_CACHE_KEY_PREFIX}:${userId}`,
    `${WATCHLIST_CACHE_KEY_PREFIX}:${userId}`,
    `${SOCIAL_CACHE_KEY_PREFIX}:${userId}`,
    `${USER_PROFILE_CACHE_KEY_PREFIX}:${userId}`,
  ];
}

// ✅ FIX #4 — errors now bubble up instead of being swallowed
async function deleteFromBackend(
  userId: string,
  supabase: ReturnType<typeof createClient>
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `${BASE_URL}/delete-account?user_id=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers,
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      throw new Error(`Backend responded with ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ✅ FIX #2 — removed supabase.from("users").delete() — let backend handle auth user deletion
async function deleteLocalAccountData(
  userId: string,
  supabase: ReturnType<typeof createClient>
) {
  const cleanupCalls = [
    supabase.from("friend_requests").delete().eq("from", userId),
    supabase.from("friend_requests").delete().eq("to", userId),
    supabase
      .from("friends")
      .delete()
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
    supabase.from("trades").delete().eq("user_id", userId),
    supabase.from("auto_almanack").delete().eq("user_id", userId),
    // ✅ FIX #2 — removed: supabase.from("users").delete().eq("id", userId)
    // Auth user deletion is handled by the backend /delete-account endpoint
  ];

  const results = await Promise.allSettled(cleanupCalls);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.error) {
      console.error("Delete-account cleanup error", result.value.error);
    }
  }
}

export default function DeleteAccountPage() {
  // ✅ FIX #1 — supabase client created inside component
  const supabase = createClient();
  const router = useRouter(); // ✅ FIX #3 & #6
  const { user, authloading } = useAuth();
  const [stage, setStage] = useState<DeleteStage>("deleting");
  const startedRef = useRef(false);

  useEffect(() => {
    if (authloading) return;
    if (startedRef.current) return;
    startedRef.current = true;

    if (!user?.id) {
      setStage("deleted");
      return;
    }

    let active = true;

    const runDeletion = async () => {
      try {
        await deleteFromBackend(user.id, supabase);   // ✅ FIX #1 — pass supabase instance
        await deleteLocalAccountData(user.id, supabase);

        try {
          getUserCacheKeys(user.id).forEach((key) =>
            localStorage.removeItem(key)
          );
        } catch (error) {
          console.error("Delete-account cache cleanup failed", error);
        }

        if (!active) return;
        setStage("deleted");

        // ✅ FIX #3 — redirect to login after sign out
        setTimeout(async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Delete-account sign out failed", error);
          } finally {
            router.push("/login");
          }
        }, 1800);

      } catch (error) {
        // ✅ FIX #4 & #5 — show error state instead of spinning forever
        console.error("Account deletion failed", error);
        if (active) setStage("error");
      }
    };

    runDeletion();

    return () => {
      active = false;
    };
  }, [authloading, user?.id]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <AnimatePresence mode="wait">

        {/* ── Deleting ── */}
        {stage === "deleting" && (
          <motion.div
            key="deleting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-white animate-spin mb-6" />
            <p className="text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-bold">
              Purging Account Data
            </p>
          </motion.div>
        )}

        {/* ── Deleted ── */}
        {stage === "deleted" && (
          <motion.div
            key="deleted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border border-red-500/40 flex items-center justify-center mb-8">
                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              </div>
              <h1 className="text-white text-2xl font-semibold mb-3 tracking-tight">
                Account deleted
              </h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Your profile and trading history have been wiped.<br />
                Redirecting to login...
              </p>
            </div>
          </motion.div>
        )}

        {/* ✅ FIX #5 — Error state so the user isn't stuck spinning forever */}
        {stage === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border border-yellow-500/40 flex items-center justify-center mb-8">
                <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              </div>
              <h1 className="text-white text-2xl font-semibold mb-3 tracking-tight">
                Something went wrong
              </h1>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                We couldn't complete the deletion.<br />
                Please contact support if this persists.
              </p>
              <button
                onClick={() => router.push("/settings")}
                className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                ← Back to Settings
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}