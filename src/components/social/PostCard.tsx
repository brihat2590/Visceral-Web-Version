"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Post, ByUsComment } from "@/types/social";
import {
  Terminal, ArrowUpRight, MessageSquare,
  Send, Loader2, ChevronDown, ChevronUp, User,
} from "lucide-react";
import VoteButtons from "./VoteButtons";
import BookmarkButton from "./BookMarkButton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const supabase = createClient();

const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=800",
];

function getFallback(id: string): string {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

/** Derive a display name from a Supabase auth user email */
function emailToName(email: string | null | undefined): string {
  if (!email) return "Anonymous";
  return email.split("@")[0].replace(/[._]/g, " ");
}

interface PostCardProps {
  post: Post;
  variant?: "by_us" | "by_you";
}

// ── Guard wrapper ─────────────────────────────────────────────────────────────
export default function PostCard({ post, variant = "by_us" }: PostCardProps) {
  if (!post || !post.id) return null;
  return <PostCardInner post={post} variant={variant} />;
}

// ── Main card ─────────────────────────────────────────────────────────────────
function PostCardInner({ post, variant }: Required<PostCardProps>) {
  const { user } = useAuth();
  const fallback = getFallback(post.id);
  const [imgSrc, setImgSrc] = useState<string>(post.image_url ?? fallback);

  // comment panel state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ByUsComment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readingTime = Math.max(1, Math.ceil(post.post.split(" ").length / 200));

  // ── Fetch count on mount (by_us only) ────────────────────────────────────
  useEffect(() => {
    if (variant !== "by_us") return;
    supabase
      .from("by_us_comments")
      .select("id", { count: "exact", head: true })
      .eq("by_us_id", post.id)
      .then(({ count }) => setCommentCount(count ?? 0));
  }, [post.id, variant]);

  // ── Fetch full comments + resolve commenter names when panel opens ────────
  useEffect(() => {
    if (!showComments || variant !== "by_us") return;

    async function fetchComments() {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("by_us_comments")
        .select("id, by_us_id, comment, created_at, user_id")
        .eq("by_us_id", post.id)
        .order("created_at", { ascending: true });

      if (error || !data) {
        setLoadingComments(false);
        return;
      }

      // Resolve emails for all user_ids in one call
      const userIds = [...new Set(data.map((c) => c.user_id).filter(Boolean))];
      let emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        // Use the admin RPC if available, otherwise fall back to auth.getUser
        // Since we're on the client we only have access to the current user's data.
        // We store emails on comment rows using user_metadata at insert time (see handleSubmit).
        // Here we just tag the current user's own comments.
        if (user?.id) {
          emailMap[user.id] = user.email ?? "";
        }
      }

      const enriched: ByUsComment[] = data.map((c) => ({
        ...c,
        commenter_email: c.user_id
          ? emailMap[c.user_id] ?? null
          : null,
      }));

      setComments(enriched);
      setCommentCount(enriched.length);
      setLoadingComments(false);
    }

    fetchComments();
  }, [showComments, post.id, variant, user]);

  // ── Submit comment ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    if (!user) {
      toast.error("You must be logged in to comment.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("by_us_comments")
      .insert([{ by_us_id: post.id, comment: text, user_id: user.id }])
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
      setCommentCount((c) => c + 1);
      setCommentText("");
      toast.success("Comment posted.");
    }
    setSubmitting(false);
  }

  // ── Toggle comment panel ─────────────────────────────────────────────────
  function handleToggleComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowComments((v) => !v);
    if (!showComments) setTimeout(() => inputRef.current?.focus(), 120);
  }

  return (
    <div className="group w-full border border-zinc-900 bg-black hover:border-zinc-600 transition-all duration-500">
      {/* ── Clickable card area ──────────────────────────────────────────── */}
      <Link href={`/socials/posts/${post.id}`} className="block">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-2 text-zinc-600">
            <Terminal size={11} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">
              {variant === "by_us" ? post.source || "BY_US_INTERNAL" : "BY_YOU"}
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
          {/* Image */}
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
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight group-hover:text-zinc-200 transition-colors">
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

            {/* Interaction bar */}
            <div className="flex items-center gap-4" onClick={(e) => e.preventDefault()}>
              {variant === "by_us" ? (
                <button
                  onClick={handleToggleComments}
                  className="flex items-center gap-2 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>
                    {commentCount} {commentCount === 1 ? "comment" : "comments"}
                  </span>
                  {showComments ? (
                    <ChevronUp size={12} className="ml-1" />
                  ) : (
                    <ChevronDown size={12} className="ml-1" />
                  )}
                </button>
              ) : (
                <>
                  <VoteButtons post={post} />
                  <BookmarkButton postId={post.id} />
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* ── Comment panel (by_us only) ────────────────────────────────────── */}
      {variant === "by_us" && showComments && (
        <div
          className="border-t border-zinc-900 bg-zinc-950 px-6 py-5 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Comment list */}
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-zinc-600" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest text-center py-3">
              No comments yet — be the first.
            </p>
          ) : (
            <ul className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
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
                    className="flex flex-col gap-1.5 border-l-2 border-zinc-800 pl-3"
                  >
                    {/* Commenter identity row */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 shrink-0">
                        <User size={10} className="text-zinc-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
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
                    <p className="text-zinc-300 text-sm leading-relaxed pl-7">
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
            className="flex items-center gap-3 border-t border-zinc-900 pt-4"
          >
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "ADD_COMMENT..." : "LOGIN_TO_COMMENT..."}
              maxLength={500}
              disabled={!user}
              className="flex-1 bg-transparent border-b border-zinc-800 focus:border-white outline-none text-sm text-zinc-300 placeholder:text-zinc-700 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest pb-1 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim() || !user}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-all shrink-0"
            >
              {submitting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}