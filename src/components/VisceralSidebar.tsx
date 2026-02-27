"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
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
  Users,
  X,
} from "lucide-react"

const supabase = createClient()

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/first-entry" },
  { label: "Markets",   icon: <TrendingUp size={18} />,     href: "/market-screen" },
  { label: "Almanack",  icon: <BookOpen size={18} />,       href: "/almanack-archive" },
  { label: "Leagues",   icon: <BarChart2 size={18} />,      href: "/leagues" },
  { label: "Socials",   icon: <Users size={18} />,          href: "/socials" },
  { label: "Settings",  icon: <Settings size={18} />,       href: "/settings" },
]

export default function VisceralSidebar({ children }: { children?: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter() // ✅ Moved inside the component

  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [userData,    setUserData]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [signingOut,  setSigningOut]  = useState(false)

  // ✅ Replaced getUser() with getSession() — no LockManager issues
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      if (user) {
        const username = user.user_metadata?.username || user.email?.split("@")[0]
        setUserData({
          name:     username,
          email:    user.email,
          initials: username?.slice(0, 2).toUpperCase(),
        })
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  // ✅ Moved inside component — useRouter() is now accessible
  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        // ✅ Actually check the error from signOut
        throw error
      }

      toast.success("Signed out successfully")
      router.push("/login")
    } catch (e) {
      toast.error("Error signing out", {
        description: "Please try again.",
      })
      console.error("Sign out error:", e)
    } finally {
      setSigningOut(false)
    }
  }

  const sidebarWidth = collapsed ? "70px" : "240px"

  // Reusable sign-out button for both desktop + mobile
  const SignOutButton = ({ className = "" }: { className?: string }) => (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className={`flex items-center py-2.5 text-white/40 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <LogOut size={18} className={signingOut ? "animate-spin" : ""} />
      <span className="ml-3 text-[14px] font-normal">
        {signingOut ? "Signing out…" : "Logout"}
      </span>
    </button>
  )

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

        {/* ── Desktop Sidebar ── */}
        <aside className="vs-sidebar hidden md:flex relative bg-black border-r border-white/[0.08] flex-col z-30">

          {/* Header */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "px-5"} pt-7 pb-6 h-[80px]`}>
            <img src="/visceral_logo.jpg" alt="Visceral Logo" className="h-6" />
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
                    isActive
                      ? "bg-white text-black"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
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

            {/* ✅ Sign out button now works — handleSignOut has router access */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "px-2"} py-2.5 text-white/40 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <LogOut size={18} className={signingOut ? "animate-spin" : ""} />
              <span className="vs-content-fade ml-3 text-[14px] font-normal">
                {signingOut ? "Signing out…" : "Logout"}
              </span>
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
          >
            <ChevronLeft size={14} className={collapsed ? "rotate-180" : ""} />
          </button>
        </aside>

        {/* ── Main Viewport ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.08]">
            <button onClick={() => setMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="w-6" />
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* ── Mobile Sidebar ── */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-[280px] bg-black border-r border-white/[0.1] z-50 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <img src="/visceral_logo.jpg" alt="Visceral Logo" className="h-6" />
                  <span className="text-xl font-bold">Visceral</span>
                </div>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                      pathname === item.href ? "bg-white text-black" : "text-white/50"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* ✅ Mobile sign out button — also fixed */}
              <div className="border-t border-white/[0.08] pt-4 mt-4">
                {!loading && userData && (
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {userData.initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium truncate text-white">{userData.name}</span>
                      <span className="text-[11px] truncate text-white/40">{userData.email}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-4 px-4 py-3 text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <LogOut size={18} className={signingOut ? "animate-spin" : ""} />
                  <span className="text-[15px]">
                    {signingOut ? "Signing out…" : "Logout"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}