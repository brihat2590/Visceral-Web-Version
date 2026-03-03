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

function emailToName(email: string | null | undefined): string {
  if (!email) return "Anonymous";
  return email.split("@")[0].replace(/[._]/g, " ");
}

// "comments" table shape (by_you)
interface PostComment {
  id: string;
  post_id: string;
  user_id?: string | null;
  commenter_email?: string | null;
  comment: string;
  created_at: string;
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

  // ── by_us comment state ───────────────────────────────────────────────────
  const [showByUsComments, setShowByUsComments] = useState(false);
  const [byUsComments, setByUsComments] = useState<ByUsComment[]>([]);
  const [byUsCommentCount, setByUsCommentCount] = useState(0);
  const [loadingByUsComments, setLoadingByUsComments] = useState(false);
  const [byUsCommentText, setByUsCommentText] = useState("");
  const [submittingByUs, setSubmittingByUs] = useState(false);
  const byUsInputRef = useRef<HTMLInputElement>(null);

  // ── by_you comment state ──────────────────────────────────────────────────
  const [showByYouComments, setShowByYouComments] = useState(false);
  const [byYouComments, setByYouComments] = useState<PostComment[]>([]);
  const [byYouCommentCount, setByYouCommentCount] = useState(0);
  const [loadingByYouComments, setLoadingByYouComments] = useState(false);
  const [byYouCommentText, setByYouCommentText] = useState("");
  const [submittingByYou, setSubmittingByYou] = useState(false);
  const byYouInputRef = useRef<HTMLInputElement>(null);

  const readingTime = Math.max(1, Math.ceil(post.post.split(" ").length / 200));

  // ── Fetch by_us comment count on mount ────────────────────────────────────
  useEffect(() => {
    if (variant !== "by_us") return;
    supabase
      .from("by_us_comments")
      .select("id", { count: "exact", head: true })
      .eq("by_us_id", post.id)
      .then(({ count }) => setByUsCommentCount(count ?? 0));
  }, [post.id, variant]);

  // ── Fetch by_us comments when panel opens ────────────────────────────────
  useEffect(() => {
    if (!showByUsComments || variant !== "by_us") return;
    async function fetch() {
      setLoadingByUsComments(true);
      const { data, error } = await supabase
        .from("by_us_comments")
        .select("id, by_us_id, comment, created_at, user_id")
        .eq("by_us_id", post.id)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setByUsComments(
          data.map((c) => ({
            ...c,
            commenter_email:
              user?.id && c.user_id === user.id ? user.email ?? null : null,
          }))
        );
        setByUsCommentCount(data.length);
      }
      setLoadingByUsComments(false);
    }
    fetch();
  }, [showByUsComments, post.id, variant, user]);

  // ── Fetch by_you comment count on mount ──────────────────────────────────
  useEffect(() => {
    if (variant !== "by_you") return;
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post.id)
      .then(({ count }) => setByYouCommentCount(count ?? 0));
  }, [post.id, variant]);

  // ── Fetch by_you comments when panel opens ───────────────────────────────
  useEffect(() => {
    if (!showByYouComments || variant !== "by_you") return;
    async function fetch() {
      setLoadingByYouComments(true);
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, comment, created_at, user_id")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setByYouComments(
          data.map((c) => ({
            ...c,
            commenter_email:
              user?.id && c.user_id === user.id ? user.email ?? null : null,
          }))
        );
        setByYouCommentCount(data.length);
      }
      setLoadingByYouComments(false);
    }
    fetch();
  }, [showByYouComments, post.id, variant, user]);

  // ── Submit by_us comment ──────────────────────────────────────────────────
  async function submitByUsComment(e: React.FormEvent) {
    e.preventDefault();
    const text = byUsCommentText.trim();
    if (!text || !user) return;
    setSubmittingByUs(true);
    const { data, error } = await supabase
      .from("by_us_comments")
      .insert([{ by_us_id: post.id, comment: text, user_id: user.id }])
      .select("id, by_us_id, comment, created_at, user_id")
      .single();
    if (error) {
      toast.error("Failed to post comment.");
    } else {
      setByUsComments((prev) => [
        ...prev,
        { ...data, commenter_email: user.email ?? null },
      ]);
      setByUsCommentCount((c) => c + 1);
      setByUsCommentText("");
      toast.success("Comment posted.");
    }
    setSubmittingByUs(false);
  }

  // ── Submit by_you comment ─────────────────────────────────────────────────
  async function submitByYouComment(e: React.FormEvent) {
    e.preventDefault();
    const text = byYouCommentText.trim();
    if (!text || !user) return;
    setSubmittingByYou(true);
    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id: post.id, comment: text, user_id: user.id }])
      .select("id, post_id, comment, created_at, user_id")
      .single();
    if (error) {
      toast.error("Failed to post comment.");
    } else {
      setByYouComments((prev) => [
        ...prev,
        { ...data, commenter_email: user.email ?? null },
      ]);
      setByYouCommentCount((c) => c + 1);
      setByYouCommentText("");
      toast.success("Comment posted.");
    }
    setSubmittingByYou(false);
  }

  function toggleByUsComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowByUsComments((v) => !v);
    if (!showByUsComments) setTimeout(() => byUsInputRef.current?.focus(), 120);
  }

  function toggleByYouComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowByYouComments((v) => !v);
    if (!showByYouComments) setTimeout(() => byYouInputRef.current?.focus(), 120);
  }

  // ── Shared comment list renderer ──────────────────────────────────────────
  function CommentList({
    comments,
    loading,
  }: {
    comments: (ByUsComment | PostComment)[];
    loading: boolean;
  }) {
    if (loading)
      return (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-zinc-600" />
        </div>
      );
    if (comments.length === 0)
      return (
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest text-center py-3">
          No comments yet — be the first.
        </p>
      );
    return (
      <ul className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
        {comments.map((c) => {
          const isMe = user?.id && c.user_id === user.id;
          const displayName = c.commenter_email
            ? emailToName(c.commenter_email)
            : c.user_id
            ? "Member"
            : "Anonymous";
          return (
            <li key={c.id} className="flex flex-col gap-1.5 border-l-2 border-zinc-800 pl-3">
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
              <p className="text-zinc-300 text-sm leading-relaxed pl-7">{c.comment}</p>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="group w-full border border-zinc-900 bg-black hover:border-zinc-600 transition-all duration-500">
      {/* ── Clickable card link ──────────────────────────────────────────── */}
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

            {/* ── Interaction bar ────────────────────────────────────────── */}
            <div className="flex items-center gap-4" onClick={(e) => e.preventDefault()}>
              {variant === "by_us" ? (
                // by_us: comment toggle only
                <button
                  onClick={toggleByUsComments}
                  className="flex items-center gap-2 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>{byUsCommentCount} {byUsCommentCount === 1 ? "comment" : "comments"}</span>
                  {showByUsComments ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                </button>
              ) : (
                // by_you: votes + bookmark + comment toggle
                <>
                  <VoteButtons post={post} />
                  <BookmarkButton postId={post.id} />
                  <button
                    onClick={toggleByYouComments}
                    className="flex items-center gap-2 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors ml-auto"
                  >
                    <MessageSquare size={13} />
                    <span>{byYouCommentCount} {byYouCommentCount === 1 ? "comment" : "comments"}</span>
                    {showByYouComments ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* ── by_us comment panel ───────────────────────────────────────────── */}
      {variant === "by_us" && showByUsComments && (
        <div
          className="border-t border-zinc-900 bg-zinc-950 px-6 py-5 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CommentList comments={byUsComments} loading={loadingByUsComments} />
          <form onSubmit={submitByUsComment} className="flex items-center gap-3 border-t border-zinc-900 pt-4">
            <input
              ref={byUsInputRef}
              type="text"
              value={byUsCommentText}
              onChange={(e) => setByUsCommentText(e.target.value)}
              placeholder={user ? "ADD_COMMENT..." : "LOGIN_TO_COMMENT..."}
              maxLength={500}
              disabled={!user}
              className="flex-1 bg-transparent border-b border-zinc-800 focus:border-white outline-none text-sm text-zinc-300 placeholder:text-zinc-700 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest pb-1 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={submittingByUs || !byUsCommentText.trim() || !user}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-all shrink-0"
            >
              {submittingByUs ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post
            </button>
          </form>
        </div>
      )}

      {/* ── by_you comment panel ────────────────────────────────────���─────── */}
      {variant === "by_you" && showByYouComments && (
        <div
          className="border-t border-zinc-900 bg-zinc-950 px-6 py-5 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CommentList comments={byYouComments} loading={loadingByYouComments} />
          <form onSubmit={submitByYouComment} className="flex items-center gap-3 border-t border-zinc-900 pt-4">
            <input
              ref={byYouInputRef}
              type="text"
              value={byYouCommentText}
              onChange={(e) => setByYouCommentText(e.target.value)}
              placeholder={user ? "ADD_COMMENT..." : "LOGIN_TO_COMMENT..."}
              maxLength={500}
              disabled={!user}
              className="flex-1 bg-transparent border-b border-zinc-800 focus:border-white outline-none text-sm text-zinc-300 placeholder:text-zinc-700 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest pb-1 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={submittingByYou || !byYouCommentText.trim() || !user}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-all shrink-0"
            >
              {submittingByYou ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}