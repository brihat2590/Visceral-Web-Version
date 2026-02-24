"use client"

import React, { useState, useEffect, useRef } from "react"
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

// ... [Keep NavItem, VisceralSidebarProps, VLogo, and NAV_ITEMS exactly as you had them]
interface NavItem {
  label: string
  icon: React.ReactNode
  href?: string
  active?: boolean
}

interface VisceralSidebarProps {
  user?: {
    name: string
    email: string
    avatarInitials?: string
  }
  onLogout?: () => void
  children?: React.ReactNode
}

const VLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 4 12 20 20 4" />
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  icon: <LayoutDashboard size={17} />, active: true },
  { label: "Positions",  icon: <TrendingUp size={17} /> },
  { label: "Almanack",   icon: <BookOpen size={17} /> },
  { label: "Analytics",  icon: <BarChart2 size={17} /> },
  { label: "Settings",   icon: <Settings size={17} /> },
]

export default function VisceralSidebar({
  user = {
    name: "Alex Morgan",
    email: "alex@visceral.app",
    avatarInitials: "AM",
  },
  onLogout,
  children,
}: VisceralSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(false)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const sidebarWidth = collapsed ? "60px" : "220px"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');

        /* Sidebar slide */
        .vs-sidebar {
          width: ${sidebarWidth};
          transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width;
        }

        /* Label fade */
        .vs-label {
          opacity: ${collapsed ? 0 : 1};
          width:   ${collapsed ? 0 : "auto"};
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.2s ease, width 0.28s cubic-bezier(0.4,0,0.2,1);
          pointer-events: ${collapsed ? "none" : "auto"};
        }

        .vs-brand-text {
          opacity: ${collapsed ? 0 : 1};
          width:   ${collapsed ? 0 : "auto"};
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.15s ease 0.02s, width 0.28s cubic-bezier(0.4,0,0.2,1);
        }

        .vs-nav-btn {
          position: relative;
          overflow: hidden;
          transition: color 0.18s ease;
        }
        .vs-nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
          border-radius: inherit;
        }
        .vs-nav-btn:hover::before,
        .vs-nav-btn.active::before { transform: scaleX(1); }
        .vs-nav-btn:hover,
        .vs-nav-btn.active          { color: black; }
        .vs-nav-inner { position: relative; z-index: 1; }

        .vs-logout {
          transition: color 0.18s ease, border-color 0.18s ease;
        }
        .vs-logout:hover { color: white; border-color: rgba(255,255,255,0.5); }

        .vs-toggle {
          transition: transform 0.25s ease, background 0.18s ease;
        }
        .vs-toggle:hover { background: rgba(255,255,255,0.1); }
        .vs-toggle.flipped { transform: rotate(180deg); }

        .vs-overlay {
          backdrop-filter: blur(4px);
          background: rgba(0,0,0,0.7);
          animation: overlayIn 0.22s ease forwards;
        }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }

        .vs-mobile-sheet {
          animation: sheetIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes sheetIn {
          from { transform: translateX(-100%); opacity: 0.5; }
          to   { transform: translateX(0);     opacity: 1; }
        }

        .vs-pip {
          width: 3px;
          border-radius: 2px;
          background: white;
          transition: height 0.2s ease, opacity 0.2s ease;
        }

        .vs-nav::-webkit-scrollbar { display: none; }
        .vs-nav { scrollbar-width: none; }

        .vs-user-avatar {
          flex-shrink: 0;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .vs-email {
          opacity: ${collapsed ? 0 : 1};
          max-height: ${collapsed ? 0 : "20px"};
          overflow: hidden;
          transition: opacity 0.18s ease, max-height 0.25s ease;
        }
      `}</style>

      {/* CHANGED: Ensure the root fills the screen and prevents horizontal scroll */}
      <div className="vs-root flex h-screen w-full bg-black text-white overflow-hidden">

        {/* ── Desktop Sidebar ── */}
        {/* CHANGED: Removed 'fixed' and 'left-0 top-0'. Added 'relative' and removed h-screen (it's inside a flex-container now) */}
        <aside
          className="vs-sidebar hidden md:flex relative bg-black border-r border-white/[0.07] flex-col z-30"
          style={{ width: sidebarWidth }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 px-3.5 pt-6 pb-5 border-b border-white/[0.06]">
            <div className="flex-shrink-0 text-white">
              <VLogo size={18} />
            </div>
            <div className="vs-brand-text">
              <span
                className="text-white tracking-[0.18em] uppercase"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", lineHeight: 1 }}
              >
                Visceral
              </span>
            </div>
          </div>

          <nav className="vs-nav flex flex-col gap-0.5 flex-1 overflow-y-auto px-2 py-4">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.label}
                onClick={() => setActiveIdx(i)}
                className={`vs-nav-btn w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-left ${
                  activeIdx === i ? "active text-black" : "text-white/40 hover:text-black"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="vs-nav-inner flex items-center gap-3 w-full">
                  {collapsed && (
                    <div className="vs-pip" style={{ height: activeIdx === i ? "20px" : "0px", opacity: activeIdx === i ? 1 : 0 }} />
                  )}
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="vs-label text-[12px] tracking-[0.08em] uppercase">{item.label}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* User footer */}
          <div className="border-t border-white/[0.06] px-2 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
              <div className="vs-user-avatar w-7 h-7 rounded-sm bg-white text-black flex items-center justify-center flex-shrink-0">
                {user.avatarInitials}
              </div>
              <div className="vs-label flex flex-col overflow-hidden">
                <span className="text-[11px] text-white/80 tracking-wider truncate uppercase">{user.name}</span>
                <span className="vs-email text-[10px] text-white/30 tracking-wide truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="vs-logout w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-white/25 border border-transparent"
              title={collapsed ? "Logout" : undefined}
            >
              <span className="flex-shrink-0"><LogOut size={15} /></span>
              <span className="vs-label text-[11px] tracking-[0.12em] uppercase">Logout</span>
            </button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`vs-toggle ${collapsed ? "" : "flipped"} absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-black border border-white/[0.12] flex items-center justify-center text-white/40 hover:text-white z-20`}
          >
            <ChevronLeft size={12} />
          </button>
        </aside>

        {/* ── Mobile Logic (Mobile overlay and sheet remain fixed/z-index high) ── */}
        {mobileOpen && (
          <div
            ref={overlayRef}
            className="vs-overlay fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {mobileOpen && (
          <aside className="vs-mobile-sheet fixed left-0 top-0 h-full w-[260px] z-50 bg-black border-r border-white/[0.08] flex flex-col md:hidden">
            <div className="flex items-center justify-between px-4 pt-6 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <VLogo size={18} />
                <span
                  className="text-white tracking-[0.18em] uppercase"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", lineHeight: 1 }}
                >
                  Visceral
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/30 hover:text-white"><X size={16} /></button>
            </div>
            <nav className="vs-nav flex flex-col gap-0.5 flex-1 overflow-y-auto px-2 py-4">
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => { setActiveIdx(i); setMobileOpen(false) }}
                  className={`vs-nav-btn w-full flex items-center gap-3 px-3 py-3 rounded-md text-left ${activeIdx === i ? "active text-black" : "text-white/40"}`}
                >
                  <div className="vs-nav-inner flex items-center gap-3 w-full">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-[12px] tracking-[0.08em] uppercase">{item.label}</span>
                  </div>
                </button>
              ))}
            </nav>
            <div className="border-t border-white/[0.06] px-2 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="vs-user-avatar w-8 h-8 rounded-sm bg-white text-black flex items-center justify-center">{user.avatarInitials}</div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] text-white/80 tracking-wider truncate uppercase">{user.name}</span>
                  <span className="text-[10px] text-white/30 tracking-wide truncate">{user.email}</span>
                </div>
              </div>
              <button onClick={onLogout} className="vs-logout w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-white/25 border border-transparent">
                <LogOut size={15} /><span className="text-[11px] tracking-[0.12em] uppercase">Logout</span>
              </button>
            </div>
          </aside>
        )}

        {/* ── Main content area ── */}
        {/* CHANGED: 'flex-1' ensures this div takes up all REMAINING space not occupied by the relative sidebar */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Mobile topbar */}
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-white/[0.07] flex-shrink-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <VLogo size={16} />
              <span
                className="text-white tracking-[0.18em] uppercase"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", lineHeight: 1 }}
              >
                Visceral
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-black text-white/50">
            {children ?? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <VLogo size={28} />
                <p className="text-xs tracking-[0.25em] uppercase text-white/20">
                  {NAV_ITEMS[activeIdx]?.label}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}