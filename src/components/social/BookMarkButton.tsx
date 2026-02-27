"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const supabase = createClient();

export default function BookmarkButton({ postId }: { postId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Check initial bookmark state on mount
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookmark")
        .select("id")
        .match({ post_id: postId, user_id: user.id })
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("BookmarkButton: failed to fetch status", error.message);
        setLoading(false);
        return;
      }

      setIsBookmarked(!!data);
      setLoading(false);
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [postId, user]); // ✅ user added to dependency array

  async function toggle() {
    // ✅ Use user from useAuth() — no supabase.auth.getUser() call
    if (!user) {
      toast.error("PROTOCOL_UNAUTHORIZED", {
        description: "Authentication required for data persistence.",
      });
      return;
    }

    // Optimistic update
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      if (previousState) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .match({ post_id: postId, user_id: user.id });

        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmark")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        toast.success("DATA_ARCHIVED", {
          description: "Post saved to secure vault.",
        });
      }
    } catch (error) {
      // Rollback on failure
      setIsBookmarked(previousState);
      toast.error("TRANSMISSION_FAILURE", {
        description: "Could not update bookmark. Please try again.",
      });
      console.error("BookmarkButton: toggle failed", error);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="group relative flex items-center justify-center p-2 transition-all"
      aria-label="Toggle Bookmark"
    >
      <Bookmark
        size={18}
        strokeWidth={2.5}
        className={`transition-all duration-300 ${
          isBookmarked
            ? "fill-white text-white scale-110"
            : "text-zinc-600 hover:text-zinc-300 group-hover:scale-110"
        }`}
      />

      {/* Subtle glow effect when bookmarked */}
      {isBookmarked && (
        <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 animate-pulse" />
      )}
    </button>
  );
}