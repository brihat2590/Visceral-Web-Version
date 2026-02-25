"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient();

export default function BookmarkButton({ postId }: { postId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check initial state on mount
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("bookmark")
        .select("id")
        .match({ post_id: postId, user_id: user.id })
        .maybeSingle();

      setIsBookmarked(!!data);
      setLoading(false);
    };
    checkStatus();
  }, [postId]);

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("PROTOCOL_UNAUTHORIZED", { 
        description: "Authentication required for data persistence." 
      });
      return;
    }

    // --- Optimistic Update ---
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      if (previousState) {
        // Remove bookmark
        await supabase
          .from("bookmark")
          .delete()
          .match({ post_id: postId, user_id: user.id });
      } else {
        // Add bookmark
        await supabase
          .from("bookmark")
          .insert({ post_id: postId, user_id: user.id });
        toast.success("DATA_ARCHIVED", { description: "Post saved to secure vault." });
      }
    } catch (error) {
      // Rollback on failure
      setIsBookmarked(previousState);
      toast.error("TRANSMISSION_FAILURE");
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
      
      {/* Subtle Glow Effect when active */}
      {isBookmarked && (
        <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 animate-pulse" />
      )}
    </button>
  );
}