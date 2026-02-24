"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react"

const supabase = createClient();

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/first-entry" },
  { label: "Markets", icon: <TrendingUp size={18} />, href: "/market-screen" },
  { label: "Almanack", icon: <BookOpen size={18} />, href: "/almanack-archive" },
  { label: "Analytics", icon: <BarChart2 size={18} />, href: "/analytics" },
  { label: "Settings", icon: <Settings size={18} />, href: "/settings" },
]

const VLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 4 12 20 20 4" />
  </svg>
)

export default function VisceralSidebar({ onLogout, children }: { onLogout?: () => void, children?: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const username = user.user_metadata?.username || user.email?.split('@')[0]
        setUserData({
          name: username,
          email: user.email,
          initials: username?.slice(0, 2).toUpperCase()
        })
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const sidebarWidth = collapsed ? "70px" : "240px"

  return (
    <>
      <style>{`
        .vs-sidebar {
          width: ${sidebarWidth};
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vs-content-fade {
          opacity: ${collapsed ? 0 : 1};
          width: ${collapsed ? 0 : "auto"};
          transition: opacity 0.2s ease, width 0.3s ease;
          pointer-events: ${collapsed ? "none" : "auto"};
          white-space: nowrap;
          overflow: hidden;
        }
      `}</style>

      <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
        <aside className="vs-sidebar hidden md:flex relative bg-black border-r border-white/[0.08] flex-col z-30">
          
          {/* Header Area */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "px-5"} pt-7 pb-6 h-[80px]`}>
            <VLogo size={22} />
            <span className="vs-content-fade ml-3 text-lg font-bold tracking-tight">
              Visceral
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${collapsed ? "justify-center" : "px-3"} py-2.5 rounded-lg transition-all ${
                    isActive ? "bg-white text-black" : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="vs-content-fade ml-3 text-[14px] font-normal">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* User Footer */}
          <div className="border-t border-white/[0.08] p-3">
            {!loading && userData && (
              <div className={`flex items-center ${collapsed ? "justify-center" : "px-2"} py-3 mb-2`}>
                <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {userData.initials}
                </div>
                <div className="vs-content-fade ml-3 flex flex-col min-w-0">
                  <span className="text-[13px] font-medium truncate text-white">{userData.name}</span>
                  <span className="text-[11px] truncate text-white/40">{userData.email}</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={onLogout}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "px-2"} py-2.5 text-white/40 hover:text-red-400 transition-colors`}
            >
              <LogOut size={18} />
              <span className="vs-content-fade ml-3 text-[14px] font-normal">Logout</span>
            </button>
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
          >
            <ChevronLeft size={14} className={collapsed ? "rotate-180" : ""} />
          </button>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.08]">
            <button onClick={() => setMobileOpen(true)}><Menu size={24} /></button>
            <VLogo size={20} />
            <div className="w-6" /> {/* Spacer */}
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-[280px] bg-black border-r border-white/[0.1] z-50 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <VLogo size={22} />
                  <span className="text-xl font-bold">Visceral</span>
                </div>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <nav className="flex-1 space-y-2">
                {NAV_ITEMS.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === item.href ? "bg-white text-black" : "text-white/50"}`}
                  >
                    {item.icon} <span className="text-[15px]">{item.label}</span>
                  </Link>
                ))}
              </nav>
              {/* Mobile Footer logic here... */}
            </div>
          </>
        )}
      </div>
    </>
  )
}