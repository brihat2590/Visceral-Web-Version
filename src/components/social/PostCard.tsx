"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Post } from "@/types/social";
import { Terminal, ArrowUpRight } from "lucide-react";
import VoteButtons from "./VoteButtons";
import BookmarkButton from "./BookMarkButton";

// ─── Pexels fallback pool ─────────────────────────────────────────────────────
// Each image is a different theme so cards don't all look the same
const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800", // code / dark screen
  "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",  // abstract light
  "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800",  // dark cityscape
  "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800", // dark minimal
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800", // tech / dark
  "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800",  // code close-up
  "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800", // laptop dark
  "https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=800", // server rack
];

// Deterministically pick a fallback based on post id so it's stable across renders
function getFallback(id: string): string {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PostCard({ post }: { post: Post }) {
  const fallback = getFallback(post.id);
  const [imgSrc, setImgSrc] = useState<string>(post.image_url ?? fallback);

  const readingTime = Math.max(1, Math.ceil(post.post.split(" ").length / 200));

  return (
    <Link
      href={`/social/posts/${post.id}`}
      className="group block w-full border border-zinc-900 bg-black hover:border-zinc-600 transition-all duration-500"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-900 bg-zinc-950">
        <div className="flex items-center gap-2 text-zinc-600">
          <Terminal size={11} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">
            {post.source || "BY_US_INTERNAL"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-700">
          <span>{readingTime} min read</span>
          <span>
            {new Date(post.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Image — always shown, falls back gracefully */}
        <div className="relative w-full md:w-[280px] md:min-w-[280px] min-h-[220px] overflow-hidden border-b md:border-b-0 md:border-r border-zinc-900 grayscale group-hover:grayscale-0 transition-all duration-700 shrink-0">
          <Image
            src={imgSrc}
            alt={post.title}
            fill
            className="object-cover opacity-50 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
            onError={() => setImgSrc(fallback)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60 md:block hidden" />
        </div>

        {/* Body */}
        <div className="flex flex-col justify-between flex-1 p-7 gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-black uppercase  tracking-tighter leading-tight group-hover:text-zinc-200 transition-colors">
                {post.title}
              </h2>
              <ArrowUpRight
                size={20}
                className="text-zinc-700 group-hover:text-white transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 shrink-0 mt-1"
              />
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 group-hover:text-zinc-400 transition-colors">
              {post.post}
            </p>
          </div>

          <div className="w-full border-t border-zinc-900" />

          <div
            className="flex items-center gap-4"
            onClick={(e) => e.preventDefault()}
          >
            <VoteButtons post={post} />
            <BookmarkButton postId={post.id} />
          </div>
        </div>
      </div>
    </Link>
  );
}