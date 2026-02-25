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
    
    // Switch table source based on the active sub-tab
    const tableSource = labTab === "by_us" ? "by_us" : "posts";

    const { data, error } = await supabase
      .from(tableSource)
      .select("id, title, post, created_at, image_url, source") // Matches your working RN query
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("DATA_FETCH_ERROR:", error.message);
      setPosts([]);
    } else {
      // If we are in "by_you", we filter the local result by user ID 
      // (or you can add .eq('user_id', user.id) to the query above if using 'posts' table)
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
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-900 pb-8 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-600">
              <Terminal size={14} />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase">Secure_Terminal_v2</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic">Social.</h1>
          </div>

          <div className="flex bg-zinc-950 border border-zinc-900 p-1">
            {["lab", "hub"].map((t) => (
              <button key={t} onClick={() => setMainTab(t as any)}
                className={`px-10 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === t ? "bg-white text-black" : "text-zinc-600 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </header>

        {mainTab === "lab" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Sub-Nav */}
            <aside className="lg:col-span-3 space-y-4">
              {["by_us", "by_you"].map((t) => (
                <button key={t} onClick={() => setLabTab(t as any)}
                  className={`w-full flex items-center gap-3 p-4 border text-[11px] font-bold tracking-widest uppercase transition-all ${labTab === t ? "border-white bg-zinc-900" : "border-zinc-900 text-zinc-600 hover:border-zinc-700"}`}>
                  <LayoutGrid size={14} /> {t.replace("_", " ")}
                </button>
              ))}
            </aside>

            {/* Feed Area */}
            <main className="lg:col-span-9 space-y-10 border-l border-zinc-900 pl-0 lg:pl-12">
              {labTab === "by_you" && <PostComposer onPost={fetchPosts} />}
              
              {loading ? (
                <div className="py-20 flex justify-center"><VisceralLoader /></div>
              ) : posts.length === 0 ? (
                <p className="text-[10px] text-zinc-800 uppercase tracking-widest italic text-center py-20 border border-dashed border-zinc-900">Directory Empty</p>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} />)
              )}
            </main>
          </div>
        ) : (
          <FriendsPanel />
        )}
      </div>
    </div>
  );
}