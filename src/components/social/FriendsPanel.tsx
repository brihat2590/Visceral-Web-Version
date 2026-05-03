"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import VisceralLoader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UserPlus, UserMinus, ShieldCheck, Search, Zap, X, Mail } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  email: string;
  user_logo?: string;
}

export default function FriendsPanel() {
  const { user } = useAuth();
  const supabase = createClient();

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadSocialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [friendsResult, incomingResult] = await Promise.all([
        supabase
          .from("friends")
          .select("*")
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase.from("friend_requests").select("*, from_user:users(username, email)").eq("to", user.id),
      ]);

      const friendIds = friendsResult.data?.map(f =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      ) || [];

      if (friendIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, username, email")
          .in("id", friendIds);
        setFriends(data || []);
      } else {
        setFriends([]);
      }
      setIncoming(incomingResult.data || []);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => { loadSocialData(); }, [loadSocialData]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from("users")
        .select("id, username, email")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", user?.id)
        .limit(6);
      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id, supabase]);

  const sendRequest = async (targetId: string, targetName: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .insert([{ from: user.id, to: targetId }]);

    if (error) toast.error("SIGNAL FAILED", { description: "Request already in queue." });
    else {
      toast.success("SIGNAL SENT", { description: `Handshake initiated with ${targetName}` });
      setSearchQuery("");
    }
  };

  const handleRequest = async (id: number, fromId: string, accept: boolean) => {
    if (accept) {
      const [a, b] = [user.id, fromId].sort();
      await supabase.from("friends").insert([{ user_id_1: a, user_id_2: b }]);
    }
    await supabase.from("friend_requests").delete().eq("id", id);
    loadSocialData();
  };

  if (loading) return <div className="min-h-[50vh] flex flex-col items-center justify-center"><VisceralLoader size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 px-2 sm:px-0">
      
      {/* 🔍 Global Network Search */}
      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={14} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="SCAN NETWORK BY USERNAME..."
            className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-12 text-[10px] font-black tracking-[0.2em] uppercase focus:border-white outline-none transition-all"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.map(u => (
              <div key={u.id} className="border border-zinc-800 bg-zinc-900/10 p-4 flex items-center justify-between group hover:border-zinc-500">
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{u.username}</p>
                  <p className="text-[9px] text-zinc-600 tracking-widest truncate">{u.email}</p>
                </div>
                <button onClick={() => sendRequest(u.id, u.username)} className="p-2 bg-white text-black hover:bg-zinc-300 transition-colors">
                  <UserPlus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 🛡️ Verified Connections (Friends) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
            <ShieldCheck size={16} className="text-white" />
            <h3 className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Verified Nodes</h3>
            <span className="ml-auto font-mono text-[10px] text-zinc-600">COUNT_{friends.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(f => (
              <div key={f.id} className="border border-zinc-900 bg-zinc-950/50 p-5 flex items-center justify-between group relative">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <p className="text-sm font-bold uppercase tracking-tighter truncate">{f.username}</p>
                  <div className="flex items-center gap-2">
                    <Mail size={10} className="text-zinc-700" />
                    <p className="text-[9px] text-zinc-600 tracking-widest truncate uppercase">{f.email}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-700 hover:text-white transition-all">
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="col-span-full py-12 border border-zinc-900 bg-zinc-950/20 text-center">
                <p className="text-[10px] text-zinc-800 uppercase tracking-[0.4em] italic">No active connections logged.</p>
              </div>
            )}
          </div>
        </section>

        {/* ⚡ Incoming Transmissions (Requests) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
            <Zap size={16} className="text-white" />
            <h3 className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Signal Queue</h3>
          </div>

          <div className="space-y-3">
            {incoming.map(r => (
              <div key={r.id} className="border border-zinc-800 bg-zinc-900/30 p-4 space-y-4">
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase text-zinc-300 truncate">
                    {r.from_user?.username || "UNKNOWN_NODE"}
                  </p>
                  <p className="text-[9px] text-zinc-600 tracking-wider truncate uppercase">
                    {r.from_user?.email || "ENCRYPTED@MAIL.COM"}
                  </p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-zinc-900">
                  <button 
                    onClick={() => handleRequest(r.id, r.from, true)}
                    className="flex-1 bg-white text-black text-[10px] font-black py-2 uppercase hover:bg-zinc-200"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRequest(r.id, r.from, false)}
                    className="p-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {incoming.length === 0 && (
              <p className="text-[10px] text-zinc-800 uppercase tracking-widest text-center py-6 border border-zinc-900/50">Queue Empty</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}