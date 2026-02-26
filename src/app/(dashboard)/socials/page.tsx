"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import PostCard from "@/components/social/PostCard";
import PostComposer from "@/components/social/PostComposer";
import FriendsPanel from "@/components/social/FriendsPanel";
import VisceralLoader from "@/components/Loader";

import { Post } from "@/types/social";
import { Terminal, LayoutGrid } from "lucide-react";

const supabase = createClient();

export default function SocialPage() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<"lab" | "hub">("lab");
  const [labTab, setLabTab] = useState<"by_us" | "by_you">("by_us");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const tableSource = labTab === "by_us" ? "by_us" : "posts";
    const selection=tableSource === "by_us" ? "id, title, post, created_at, image_url, source" : "id, title, post"

    const { data, error } = await supabase
      .from(tableSource)
      .select(selection)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("DATA_FETCH_ERROR:", error.message);
      setPosts([]);
    } else {
      let filteredData = data || [];
      if (labTab === "by_you" && user?.id) {
        filteredData = filteredData.filter((p: any) => p.user_id === user.id);
      }
      setPosts(filteredData);
    }
    setLoading(false);
  }, [labTab, user?.id]);

  useEffect(() => {
    if (mainTab === "lab") fetchPosts();
  }, [mainTab, labTab, fetchPosts]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-zinc-900 pb-8">

          {/* Top row: title + main tab toggle */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

            {/* Title block */}
            <div className="flex flex-col gap-1">
              {/* <div className="flex items-center gap-2 text-zinc-600">
                <Terminal size={14} />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase">
                  Secure_Terminal_v2
                </span>
              </div> */}
              <h1 className="text-6xl font-black tracking-tighter uppercase ">
                Social.
              </h1>
            </div>

            {/* Lab / Hub toggle */}
            <div className="flex bg-zinc-950 border border-zinc-900 p-1 self-start md:self-auto">
              {["lab", "hub"].map((t) => (
                <button
                  key={t}
                  onClick={() => setMainTab(t as any)}
                  className={`px-10 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    mainTab === t
                      ? "bg-white text-black"
                      : "text-zinc-600 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-tab row: by_us / by_you — only visible in lab */}
          {mainTab === "lab" && (
            <div className="flex flex-col gap-2">
              {["by_us", "by_you"].map((t) => (
                <button
                  key={t}
                  onClick={() => setLabTab(t as any)}
                  className={`flex items-center gap-3 p-4 border text-[11px] font-bold tracking-widest uppercase transition-all ${
                    labTab === t
                      ? "border-white bg-zinc-900 text-white"
                      : "border-zinc-900 text-zinc-600 hover:border-zinc-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex flex-col gap-10">
          {mainTab === "lab" ? (
            <>
              {labTab === "by_you" && <PostComposer onPost={fetchPosts} />}

              {loading ? (
                <div className="py-20 flex justify-center">
                  <VisceralLoader />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-[10px] text-zinc-800 uppercase tracking-widest  text-center py-20 border border-dashed border-zinc-900">
                  Directory Empty
                </p>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </>
          ) : (
            <FriendsPanel />
          )}
        </main>

      </div>
    </div>
  );
}