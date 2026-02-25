"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import VisceralLoader from '@/components/Loader';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string;
  email: string;
  user_logo?: string;
}

export default function SocialDashboard() {
  const { user } = useAuth();
  const supabase = createClient();

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadSocialData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [friendsResult, incomingResult, outgoingResult, selfProfileResult] = await Promise.all([
        supabase.from("friends").select("*").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase.from("friend_requests").select("*").eq("to", user.id),
        supabase.from("friend_requests").select("*").eq("from", user.id),
        supabase.from("users").select("id,username,email,user_logo").eq("id", user.id).maybeSingle(),
      ]);

      const friendIds = friendsResult.data?.map(f => f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1) || [];
      
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase.from("users").select("id, username, email").in("id", friendIds);
        setFriends(friendProfiles || []);
      } else {
        setFriends([]);
      }

      setIncoming(incomingResult.data || []);
      setOutgoing(outgoingResult.data || []);
      setProfile(selfProfileResult.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  // --- REAL-TIME SEARCH LOGIC ---
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from("users")
        .select("id, username, email")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", user?.id) 
        .limit(10);
      
      setSearchResults(data || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id, supabase]);

  // --- REAL-TIME DATABASE SUBSCRIPTION ---
  useEffect(() => {
    if (!user?.id) return;
    loadSocialData();

    const channel = supabase
      .channel('social_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => loadSocialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => loadSocialData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadSocialData, supabase]);

  // --- ACTIONS ---
  const sendRequest = async (targetId: string, targetName: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .insert([{ from: user.id, to: targetId }]);
    
    if (error) {
      toast.error("Action Denied", { description: "Request already exists." });
    } else {
      toast.success("Signal Sent", { description: `Request sent to ${targetName}` });
      setSearchQuery("");
    }
  };

  const handleRequest = async (requestId: number, fromId: string, accept: boolean) => {
    const promise = async () => {
      if (accept) {
        const [id1, id2] = [user.id, fromId].sort();
        await supabase.from("friends").insert([{ user_id_1: id1, user_id_2: id2 }]);
      }
      await supabase.from("friend_requests").delete().eq("id", requestId);
    };

    toast.promise(promise(), {
      loading: accept ? 'Linking...' : 'Ignoring...',
      success: accept ? 'Linked' : 'Ignored',
      error: 'Signal lost',
    });
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><VisceralLoader /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="border-b border-zinc-900 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tighter  uppercase">Network</h1>
            <p className="text-zinc-500 text-xs mt-2 uppercase ">User: {profile?.username}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT: Search & Discovery */}
          <section className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Find Users</h2>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY USERNAME..." 
                className="w-full bg-zinc-950 border border-zinc-800 p-4 text-xs outline-none focus:border-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Results</h2>
              {isSearching && <p className="text-xs text-zinc-500 animate-pulse">Scanning...</p>}
              {!isSearching && searchResults.length === 0 && searchQuery.length > 1 && (
                <p className="text-xs text-zinc-700 italic">No matches for "{searchQuery}"</p>
              )}
              {searchResults.map(u => (
                <div key={u.id} className="flex flex-col p-4 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-500 transition-all gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-tight">{u.username}</p>
                    <p className="text-[10px] text-zinc-500 tracking-wider">{u.email}</p>
                  </div>
                  <button 
                    onClick={() => sendRequest(u.id, u.username)}
                    className="w-full bg-white text-black text-[10px] font-black py-2 hover:invert transition-all uppercase"
                  >
                    Send Request
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* MIDDLE: Friends List */}
          <section className="lg:col-span-5 space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Connections</h2>
              <span className="text-xs text-zinc-700">{friends.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between p-5 bg-zinc-900/20 border border-zinc-800 group transition-all hover:bg-zinc-900/40">
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-tight uppercase">{f.username}</p>
                    <p className="text-[10px] text-zinc-600 tracking-wider">{f.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                       const [id1, id2] = [user.id, f.id].sort();
                       supabase.from("friends").delete().match({user_id_1: id1, user_id_2: id2}).then(() => {
                         toast.info("Connection Terminated");
                         loadSocialData();
                       });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-red-800 hover:text-red-500 transition-all"
                  >
                    DISCONNECT
                  </button>
                </div>
              ))}
              {friends.length === 0 && <p className="text-zinc-800 text-xs italic">Isolated system.</p>}
            </div>
          </section>

          {/* RIGHT: Incoming Requests */}
          <section className="lg:col-span-3 space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-900 pb-2">Queue</h2>
            <div className="flex flex-col gap-4">
              {incoming.map(req => (
                <div key={req.id} className="p-4 border border-zinc-800 bg-zinc-950 space-y-4">
                  <p className="text-[9px] text-zinc-500 break-all leading-tight uppercase tracking-widest opacity-50">Signal ID: {req.from.slice(0, 15)}</p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleRequest(req.id, req.from, true)}
                      className="w-full bg-white text-black text-[10px] font-black py-2 hover:bg-zinc-200 transition-colors uppercase"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRequest(req.id, req.from, false)}
                      className="w-full border border-zinc-800 text-zinc-500 text-[10px] font-black py-2 hover:bg-zinc-900 transition-colors uppercase"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
              {incoming.length === 0 && <p className="text-zinc-800 text-[10px] uppercase tracking-tighter">Empty</p>}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}