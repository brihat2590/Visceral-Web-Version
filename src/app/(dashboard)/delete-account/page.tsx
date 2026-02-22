"use client";
import { createClient } from "@/lib/supabase/client";
const supabase=createClient();

import {motion,AnimatePresence} from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

import { useEffect, useRef, useState } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ;

const HOME_CACHE_KEY_PREFIX = "first_entry_home_cache_v1";
const WATCHLIST_CACHE_KEY_PREFIX = "watchlist_cache_v1";
const SOCIAL_CACHE_KEY_PREFIX = "social_screen_cache_v1";
const USER_PROFILE_CACHE_KEY_PREFIX = "user_profile_screen_cache_v1";

type DeleteStage = "deleting" | "deleted";

function getUserCacheKeys(userId: string) {
  return [
    `${HOME_CACHE_KEY_PREFIX}:${userId}`,
    `${WATCHLIST_CACHE_KEY_PREFIX}:${userId}`,
    `${SOCIAL_CACHE_KEY_PREFIX}:${userId}`,
    `${USER_PROFILE_CACHE_KEY_PREFIX}:${userId}`,
  ];
}

async function deleteFromBackend(userId: string) {
  try {
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
      await fetch(
        `${BASE_URL}/delete-account?user_id=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers,
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Delete-account backend call failed", error);
  }
}

async function deleteLocalAccountData(userId: string) {
  const cleanupCalls = [
    supabase.from("friend_requests").delete().eq("from", userId),
    supabase.from("friend_requests").delete().eq("to", userId),
    supabase
      .from("friends")
      .delete()
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
    supabase.from("trades").delete().eq("user_id", userId),
    supabase.from("auto_almanack").delete().eq("user_id", userId),
    supabase.from("users").delete().eq("id", userId),
  ];

  const results = await Promise.allSettled(cleanupCalls);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.error) {
      console.error("Delete-account cleanup error", result.value.error);
    }
  }
}

export default function DeleteAccountPage() {
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
      await deleteFromBackend(user.id);
      await deleteLocalAccountData(user.id);

      try {
        getUserCacheKeys(user.id).forEach((key) =>
          localStorage.removeItem(key)
        );
      } catch (error) {
        console.error("Delete-account cache cleanup failed", error);
      }

      if (!active) return;
      setStage("deleted");

      setTimeout(() => {
        supabase.auth.signOut().catch((error) => {
          console.error("Delete-account sign out failed", error);
        });
      }, 1200);
    };

    runDeletion();

    return () => {
      active = false;
    };
  }, [authloading, user?.id]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {stage === "deleting" ? (
          <motion.div
            key="deleting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            {/* Minimalist Spinner */}
            <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-white animate-spin mb-6" />
            <p className="text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-bold">
              Purging Account Data
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="deleted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            {/* Confirmation Card - Matches "Buy Confirmed" UI */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-12 flex flex-col items-center text-center">
              
              {/* Status Icon */}
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
      </AnimatePresence>
    </div>
  );
}