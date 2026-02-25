"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase=createClient();

export default function PostComposer({ onPost }: { onPost: () => void }) {
  const [title, setTitle] = useState("");
  const [post, setPost] = useState("");

  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("posts").insert({
      title,
      post,
      user_id: user.id,
    });

    setTitle("");
    setPost("");
    onPost();
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-lg space-y-2">
      <input
        className="w-full bg-black p-2 rounded"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-black p-2 rounded"
        placeholder="Share your thought..."
        value={post}
        onChange={e => setPost(e.target.value)}
      />
      <button
        onClick={submit}
        className="bg-white text-black px-4 py-1 rounded"
      >
        Post
      </button>
    </div>
  );
}