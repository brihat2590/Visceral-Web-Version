"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types/social";
import { Terminal, ArrowLeft, Calendar, Clock } from "lucide-react";
import VoteButtons from "@/components/social/VoteButtons";
import BookmarkButton from "@/components/social/BookMarkButton";
import VisceralLoader from "@/components/Loader";

// ─── Pexels fallback pool ─────────────────────────────────────────────────────
const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200", // code / dark screen
  "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200",  // abstract light
  "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1200",  // dark cityscape
  "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200", // dark minimal
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200", // tech / dark
  "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1200",  // code close-up
  "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200", // laptop dark
  "https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=1200", // server rack
];

function getFallback(id: string): string {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient();

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      setLoading(true);

      // Try by_us first, fall back to posts table
      const { data: byUs } = await supabase
        .from("by_us")
        .select("id, title, post, created_at, image_url, source" )
        .eq("id", id)
        .maybeSingle();

      if (byUs) {
        setPost(byUs as Post);
        setImgSrc(byUs.image_url ?? getFallback(id));
        setLoading(false);
        return;
      }

      const { data: userPost } = await supabase
        .from("posts")
        .select("id, title, post, created_at, image_url, source, upvotes, downvotes, user_id")
        .eq("id", id)
        .maybeSingle();

      if (userPost) {
        setPost(userPost as Post);
        setImgSrc(userPost.image_url ?? getFallback(id));
      } else {
        setNotFoundState(true);
      }

      setLoading(false);
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <VisceralLoader />
      </div>
    );
  }

  if (notFoundState || !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <Terminal size={32} className="text-zinc-700" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
          Signal_Not_Found
        </p>
        <Link
          href="/socials"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={12} /> Back to Socials
        </Link>
      </div>
    );
  }

  const readingTime = Math.max(1, Math.ceil(post.post.split(" ").length / 200));
  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative w-full">
        <div className="relative w-full h-[55vh] min-h-[360px]">
          <Image
            src={imgSrc}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-30"
            onError={() => setImgSrc(getFallback(post.id))}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        </div>

        {/* Back link over hero */}
        <div className="absolute top-6 left-0 right-0 max-w-3xl mx-auto px-6 md:px-0">
          <Link
            href="/socials"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Socials
          </Link>
        </div>
      </div>

      {/* ── Article ───────────────────────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-6 md:px-0 pb-32 flex flex-col gap-10 -mt-16 relative z-10">

        {/* Source badge */}
        <div className="flex items-center gap-2 text-zinc-600">
          <Terminal size={11} />
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">
            {post.source || "BY_US_INTERNAL"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
          {post.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 border-y border-zinc-900 py-4">
          <span className="flex items-center gap-2">
            <Calendar size={11} />
            {formattedDate}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={11} />
            {readingTime} min read
          </span>
        </div>

        {/* Body — split on double newlines for paragraphs */}
        <div className="flex flex-col gap-6">
          {post.post.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-zinc-300 text-base md:text-lg leading-[1.9] tracking-wide font-medium"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-900" />

        {/* Bottom actions */}
        <div className="flex items-center gap-4">
          <VoteButtons post={post} />
          <BookmarkButton postId={post.id} />
        </div>

      </article>
    </div>
  );
}