"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  History, 
  Archive, 
  Settings, 
  LogOut, 
  ChevronRight, 
  UserPlus,
  Landmark 
} from "lucide-react";
import { toast } from "sonner"; 
import VisceralLoader from "@/components/Loader";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // State Management
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [almanackBullets, setAlmanackBullets] = useState<string[]>([]);

  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);

      try {
        // Fetch from Supabase Table and Backend simultaneously
        const [dbResult, homeResult] = await Promise.all([
          supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
          fetch(`${BASE_URL}/home?user_id=${user.id}`).then(res => res.json())
        ]);

        if (dbResult.data) setProfileData(dbResult.data);
        
        // Extract Almanack Bullets (Logic from your native code)
        if (homeResult?.almanack?.system_analysis) {
          const raw = homeResult.almanack.system_analysis;
          const bullets = raw.split(/\n+/).map((l: string) => l.trim()).filter(Boolean).slice(0, 4);
          setAlmanackBullets(bullets);
        }
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    }
    getInitialData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();

    toast.success("Logged out successfully");
    router.refresh();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><VisceralLoader size={"lg"}></VisceralLoader></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-5xl mx-auto font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {profileData?.username || user?.email?.split('@')[0]} 
          </h1>
          <p className="text-neutral-500 mt-2 text-sm uppercase tracking-wider">
            Decision-making analysis
          </p>
        </div>
        <Link href={"/socials"} className="bg-neutral-900 border border-neutral-800 px-6 py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors">
          ADD FRIEND
        </Link>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <MetricCard 
            label="INTUITION SCORE" 
            value={profileData?.intuition_score || "78"} 
        />
        <MetricCard 
            label="CURRENT STREAK" 
            value={`${profileData?.current_streak || 0} days`} 
        />
        <MetricCard 
            label="TRADER DAY" 
            value={`#${profileData?.trader_days || 0}`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] uppercase">
              Almanack Analysis
            </h2>
            <button className="text-neutral-600 text-[10px] underline hover:text-neutral-400">
              View Full Report
            </button>
          </div>
          <div className="bg-[#0A0A0A] border border-neutral-900 rounded-xl p-8 min-h-[300px]">
            <ul className="space-y-6">
              {almanackBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-600 mt-2 transition-colors group-hover:bg-white" />
                  <p className="text-neutral-300 text-sm leading-relaxed font-light group-hover:text-white transition-colors">
                    {bullet}
                  </p>
                </li>
              ))}
              {almanackBullets.length === 0 && (
                <p className="text-neutral-600 italic">Analysis pending more trade data...</p>
              )}
            </ul>
          </div>
        </div>

        {/* Account Menu */}
        <div>
          <h2 className="text-neutral-500 text-[10px] font-bold tracking-[2px] uppercase mb-4">
            Account
          </h2>
          <div className="bg-[#0A0A0A] border border-neutral-900 rounded-xl overflow-hidden">
            <MenuRow 
              icon={<History size={18} />} 
              label="Trade History" 
              onClick={() => router.push("settings/trade-history")} 
            />
            <MenuRow 
              icon={<Archive size={18} />} 
              label="Almanack Archive" 
              onClick={() => router.push("/almanack-archive")} 
            />
            <MenuRow 
              icon={<Landmark size={18} />} 
              label="Financial Guide" 
              onClick={() => router.push("/settings/financial-guide")} 
            />
            <MenuRow 
              icon={<Settings size={18} />} 
              label="Settings" 
              onClick={() => router.push("/settings/account-settings")} 
            />
            <MenuRow 
              icon={<LogOut size={18} />} 
              label="Log Out" 
              onClick={handleSignOut}
              isLast 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Styled Sub-components --- */

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-neutral-900 rounded-xl p-8 hover:border-neutral-700 transition-colors">
      <p className="text-neutral-500 text-[9px] font-bold tracking-[1.5px] uppercase mb-4">
        {label}
      </p>
      <p className="text-5xl font-light tracking-tighter">{value}</p>
    </div>
  );
}

function MenuRow({ 
  icon, 
  label, 
  onClick, 
  isLast 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 hover:bg-neutral-900/50 transition-all group ${!isLast ? 'border-b border-neutral-900' : ''}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-neutral-500 group-hover:text-white transition-colors">
          {icon}
        </span>
        <span className="text-sm font-medium tracking-tight group-hover:translate-x-1 transition-transform">
          {label}
        </span>
      </div>
      <ChevronRight size={16} className="text-neutral-700 group-hover:text-white" />
    </button>
  );
}