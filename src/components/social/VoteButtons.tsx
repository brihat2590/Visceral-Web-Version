"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types/social";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function VoteButtons({ post }: { post: Post }) {
  // ✅ FIX #1 & #2 — useAuth called at top level, single auth source
  const { user } = useAuth();
  const supabase = createClient();

  const [voteStatus, setVoteStatus] = useState<"up" | "down" | null>(null);
  const [counts, setCounts] = useState({
    up: post.upvotes || 0,
    down: post.downvotes || 0,
  });

  // ✅ FIX #3 — user added to dependency array
  useEffect(() => {
    const checkVote = async () => {
      if (!user) return;

      const [up, down] = await Promise.all([
        supabase
          .from("upvotes")
          .select("id")
          .match({ post_id: post.id, user_id: user.id })
          .maybeSingle(),
        supabase
          .from("downvotes")
          .select("id")
          .match({ post_id: post.id, user_id: user.id })
          .maybeSingle(),
      ]);

      if (up.data) setVoteStatus("up");
      else if (down.data) setVoteStatus("down");
    };

    checkVote();
  }, [post.id, user]); // ✅ user is a dependency

  async function handleVote(type: "up" | "down") {
    // ✅ FIX #2 — use the hook's user, no extra async auth call
    if (!user) {
      toast.error("Please sign in to vote.");
      return;
    }

    const isRemoving = voteStatus === type;
    const opposite = type === "up" ? "down" : "up";
    const wasOpposite = voteStatus === opposite;

    // ✅ FIX #4 & #5 — snapshot state before optimistic update for rollback
    const previousCounts = counts;
    const previousVoteStatus = voteStatus;

    // Optimistic UI update
    setVoteStatus(isRemoving ? null : type);
    setCounts((prev) => ({
      ...prev,
      [type]: isRemoving ? prev[type] - 1 : prev[type] + 1,
      [opposite]: wasOpposite ? prev[opposite] - 1 : prev[opposite],
    }));

    try {
      // 1. Always clear the opposite vote first
      await supabase
        .from(`${opposite}votes`)
        .delete()
        .match({ post_id: post.id, user_id: user.id });

      if (isRemoving) {
        // 2. Toggle off — remove current vote
        await supabase
          .from(`${type}votes`)
          .delete()
          .match({ post_id: post.id, user_id: user.id });
      } else {
        // 3. Insert or update new vote
        await supabase
          .from(`${type}votes`)
          .upsert({ post_id: post.id, user_id: user.id });
      }
    } catch (error) {
      // ✅ FIX #4 — roll back to actual previous counts (not stale prop)
      // ✅ FIX #5 — also roll back voteStatus (was missing entirely)
      toast.error("Vote failed. Please try again.");
      setCounts(previousCounts);
      setVoteStatus(previousVoteStatus);
    }
  }

  return (
    <div className="flex items-center gap-6 border border-zinc-900 bg-black p-1 px-3 rounded-sm">
      {/* Upvote */}
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => handleVote("up")}
          className={`transition-all ${
            voteStatus === "up"
              ? "text-white"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          <ChevronUp size={20} strokeWidth={voteStatus === "up" ? 3 : 2} />
        </button>
        <span className="text-[10px] font-black font-mono tracking-tighter w-4 text-center">
          {counts.up}
        </span>
      </div>

      <div className="w-[1px] h-4 bg-zinc-900" />

      {/* Downvote */}
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => handleVote("down")}
          className={`transition-all ${
            voteStatus === "down"
              ? "text-white"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          <ChevronDown
            size={20}
            strokeWidth={voteStatus === "down" ? 3 : 2}
          />
        </button>
        <span className="text-[10px] font-black font-mono tracking-tighter w-4 text-center">
          {counts.down}
        </span>
      </div>
    </div>
  );
}