"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Comment } from "@/types/social";

const supabase=createClient();

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at");

    setComments(data || []);
  }

  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      comment: text,
    });

    setText("");
    fetchComments();
  }

  return (
    <div className="space-y-2">
      {comments.map(c => (
        <div key={c.id} className="text-xs text-zinc-400">
          {c.comment}
        </div>
      ))}

      <div className="flex gap-2">
        <input
          className="flex-1 bg-black p-1 rounded text-xs"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add comment"
        />
        <button onClick={submit} className="text-xs">
          Send
        </button>
      </div>
    </div>
  );
}