import Image from "next/image";
import { Post } from "@/types/social";
import { Terminal, Calendar, Share2 } from "lucide-react";
import VoteButtons from "./VoteButtons";
import BookmarkButton from "./BookMarkButton";

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="w-full border border-zinc-900 bg-black group hover:border-zinc-400 transition-all duration-500">
      {/* Top Metadata */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-900 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Terminal size={12} />
          <span>Origin: {post.source || "BY_US_INTERNAL"}</span>
        </div>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Photo Section */}
        {post.image_url && (
          <div className="relative w-full md:w-1/3 min-h-[250px] grayscale group-hover:grayscale-0 transition-all duration-1000 overflow-hidden border-r border-zinc-900">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all"
            />
          </div>
        )}

        {/* Text Section */}
        <div className="flex-1 p-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold uppercase italic tracking-tighter leading-none">
              {post.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl font-medium">
              {post.post}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-6 border-t border-zinc-900">
            <VoteButtons post={post} />
            <BookmarkButton postId={post.id} />
            <button className="ml-auto text-zinc-700 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}