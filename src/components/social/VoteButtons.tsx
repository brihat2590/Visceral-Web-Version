"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types/social";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function VoteButtons({ post }: { post: Post }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [voteStatus, setVoteStatus] = useState<"up" | "down" | null>(null);
  const [counts, setCounts] = useState({
    up: post.upvotes || 0,
    down: post.downvotes || 0,
  });

  useEffect(() => {
    const init = async () => {
      // ── Always fetch real counts from the tables ──────────────────────
      const [upCount, downCount] = await Promise.all([
        supabase
          .from("upvotes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.id),
        supabase
          .from("downvotes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.id),
      ]);

      setCounts({
        up: upCount.count ?? 0,
        down: downCount.count ?? 0,
      });

      // ── Check current user's vote status ──────────────────────────────
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

    init();
  }, [post.id, user]);

  async function handleVote(type: "up" | "down") {
    if (!user) {
      toast.error("Please sign in to vote.");
      return;
    }

    const isRemoving = voteStatus === type;
    const opposite = type === "up" ? "down" : "up";
    const wasOpposite = voteStatus === opposite;

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
      await supabase
        .from(`${opposite}votes`)
        .delete()
        .match({ post_id: post.id, user_id: user.id });

      if (isRemoving) {
        await supabase
          .from(`${type}votes`)
          .delete()
          .match({ post_id: post.id, user_id: user.id });
      } else {
        await supabase
          .from(`${type}votes`)
          .upsert({ post_id: post.id, user_id: user.id });
      }
    } catch (error) {
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