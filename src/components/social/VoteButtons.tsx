"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types/social";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient();

export default function VoteButtons({ post }: { post: Post }) {
  const [voteStatus, setVoteStatus] = useState<"up" | "down" | null>(null);
  const [counts, setCounts] = useState({ up: post.upvotes || 0, down: post.downvotes || 0 });

  // Load initial user vote status
  useEffect(() => {
    const checkVote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [up, down] = await Promise.all([
        supabase.from("upvotes").select("id").match({ post_id: post.id, user_id: user.id }).maybeSingle(),
        supabase.from("downvotes").select("id").match({ post_id: post.id, user_id: user.id }).maybeSingle(),
      ]);

      if (up.data) setVoteStatus("up");
      else if (down.data) setVoteStatus("down");
    };
    checkVote();
  }, [post.id]);

  async function handleVote(type: "up" | "down") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("AUTHENTICATION_REQUIRED", { description: "Please sign in to interact." });
      return;
    }

    const isRemoving = voteStatus === type;
    const opposite = type === "up" ? "down" : "up";
    const wasOpposite = voteStatus === opposite;

    // --- Optimistic UI Update ---
    setVoteStatus(isRemoving ? null : type);
    setCounts(prev => ({
      ...prev,
      [type]: isRemoving ? prev[type] - 1 : prev[type] + 1,
      [opposite]: wasOpposite ? prev[opposite] - 1 : prev[opposite]
    }));

    try {
      // 1. Always clear the opposite table
      await supabase.from(`${opposite}votes`).delete().match({ post_id: post.id, user_id: user.id });

      if (isRemoving) {
        // 2. Clear current table if toggling off
        await supabase.from(`${type}votes`).delete().match({ post_id: post.id, user_id: user.id });
      } else {
        // 3. Insert new vote
        await supabase.from(`${type}votes`).upsert({ post_id: post.id, user_id: user.id });
      }
    } catch (error) {
      // Rollback on failure
      toast.error("TRANSMISSION_ERROR");
      setCounts({ up: post.upvotes, down: post.downvotes });
    }
  }

  return (
    <div className="flex items-center gap-6 border border-zinc-900 bg-black p-1 px-3 rounded-sm">
      {/* Upvote */}
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => handleVote("up")}
          className={`transition-all ${
            voteStatus === "up" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
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
            voteStatus === "down" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          <ChevronDown size={20} strokeWidth={voteStatus === "down" ? 3 : 2} />
        </button>
        <span className="text-[10px] font-black font-mono tracking-tighter w-4 text-center">
          {counts.down}
        </span>
      </div>
    </div>
  );
}