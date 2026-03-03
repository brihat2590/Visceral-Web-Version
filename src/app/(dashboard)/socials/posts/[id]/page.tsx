"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Post, ByUsComment } from "@/types/social";
import { Terminal, ArrowLeft, Calendar, Clock, MessageSquare, Send, Loader2, User } from "lucide-react";
import VoteButtons from "@/components/social/VoteButtons";
import BookmarkButton from "@/components/social/BookMarkButton";
import VisceralLoader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

function getFallback(id: string): string {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

function emailToName(email: string | null | undefined): string {
  if (!email) return "Anonymous";
  return email.split("@")[0].replace(/[._]/g, " ");
}

const supabase = createClient();

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isFromByUs, setIsFromByUs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");

  // comments
  const [comments, setComments] = useState<ByUsComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch post ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    async function fetchPost() {
      setLoading(true);
      const { data: byUs } = await supabase
        .from("by_us")
        .select("id, title, post, created_at, image_url, source")
        .eq("id", id)
        .maybeSingle();

      if (byUs) {
        setPost(byUs as Post);
        setIsFromByUs(true);
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
        setIsFromByUs(false);
        setImgSrc(userPost.image_url ?? getFallback(id));
      } else {
        setNotFoundState(true);
      }
      setLoading(false);
    }
    fetchPost();
  }, [id]);

  // ── Fetch by_us comments ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !isFromByUs) return;
    async function fetchComments() {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("by_us_comments")
        .select("id, by_us_id, comment, created_at, user_id")
        .eq("by_us_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        // Tag current user's email on their own comments
        const enriched: ByUsComment[] = data.map((c) => ({
          ...c,
          commenter_email:
            user?.id && c.user_id === user.id ? user.email ?? null : null,
        }));
        setComments(enriched);
      }
      setLoadingComments(false);
    }
    fetchComments();
  }, [id, isFromByUs, user]);

  // ── Submit comment ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !user) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("by_us_comments")
      .insert([{ by_us_id: id, comment: text, user_id: user.id }])
      .select("id, by_us_id, comment, created_at, user_id")
      .single();

    if (error) {
      toast.error("Failed to post comment.");
    } else {
      const newComment: ByUsComment = {
        ...data,
        commenter_email: user.email ?? null,
      };
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      toast.success("Comment posted.");
    }
    setSubmitting(false);
  }

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
      {/* ── Hero ────────────────────────────────────────────────────────── */}
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

      {/* ── Article ─────────────────────────────────────────────────────── */}
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
          {isFromByUs && (
            <span className="flex items-center gap-2 ml-auto">
              <MessageSquare size={11} />
              {loadingComments ? "..." : comments.length}{" "}
              {comments.length === 1 ? "comment" : "comments"}
            </span>
          )}
        </div>

        {/* Body */}
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

        <div className="border-t border-zinc-900" />

        {/* Bottom actions — only for by_you posts */}
        {!isFromByUs && (
          <div className="flex items-center gap-4">
            <VoteButtons post={post} />
            <BookmarkButton postId={post.id} />
          </div>
        )}

        {/* ── Comments section (by_us only) ──────────────────────────────── */}
        {isFromByUs && (
          <section className="flex flex-col gap-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-2">
              <MessageSquare size={13} />
              Discussion
            </h2>

            {/* Comment list */}
            {loadingComments ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-zinc-600" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-[10px] text-zinc-700 uppercase tracking-widest text-center py-8 border border-dashed border-zinc-900">
                No comments yet — be the first.
              </p>
            ) : (
              <ul className="flex flex-col gap-5">
                {comments.map((c) => {
                  const isMe = user?.id && c.user_id === user.id;
                  const displayName = c.commenter_email
                    ? emailToName(c.commenter_email)
                    : c.user_id
                    ? "Member"
                    : "Anonymous";

                  return (
                    <li
                      key={c.id}
                      className="flex flex-col gap-2 border-l-2 border-zinc-800 pl-4"
                    >
                      {/* Identity row */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
                          <User size={11} className="text-zinc-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                          {isMe ? "You" : displayName}
                        </span>
                        <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest ml-auto">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {/* Comment text */}
                      <p className="text-zinc-400 text-sm leading-relaxed pl-8">
                        {c.comment}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Compose */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 border-t border-zinc-900 pt-6"
            >
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "ADD_COMMENT..." : "LOGIN_TO_COMMENT..."}
                maxLength={500}
                disabled={!user}
                className="flex-1 bg-transparent border-b border-zinc-800 focus:border-white outline-none text-sm text-zinc-300 placeholder:text-zinc-700 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest pb-2 transition-colors disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim() || !user}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-all shrink-0"
              >
                {submitting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Post
              </button>
            </form>
          </section>
        )}
      </article>
    </div>
  );
}