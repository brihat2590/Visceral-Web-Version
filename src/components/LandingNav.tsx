'use client'
import { useState } from "react";
import { Menu, X } from "lucide-react"; // install lucide-react if you haven't
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative z-[50] mx-auto flex h-[102px] w-full max-w-[1440px] items-center justify-between px-6 py-4 md:px-[120px]">
      <div className="flex items-center gap-20">
        <Link href="/" className="flex h-12 items-center">
          <div className="bg-white px-2 py-1 text-xl font-black italic tracking-tighter text-black">VISCERAL</div>
        </Link>

        {/* Desktop Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/" className="px-2.5 py-1 text-sm font-medium leading-[22px] text-[#cccccc] hover:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Home</Link>
          <Link href="/contact" className="px-2.5 py-1 text-sm font-medium leading-[22px] text-[#cccccc] hover:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Contact us</Link>
        </div>
      </div>

      {/* Desktop Buttons - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3">
        <Link href={"/login"} className="rounded-lg px-4 py-2 text-sm font-semibold leading-[22px] text-[#cccccc] hover:text-[#ffffff]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Login
        </Link>
        {/* <button className="px-4 py-2 bg-white rounded-lg font-semibold text-sm leading-[22px] text-[#171717]" style={{ fontFamily: 'Manrope, sans-serif', boxShadow: '0px 4px 16px rgba(23, 23, 23, 0.04)' }}>
          Get Started
        </button> */}
      </div>

      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute top-[102px] left-0 z-50 flex w-full flex-col gap-6 border-b border-white/10 bg-[#0a0a0a] p-6 md:hidden">
          <Link href="/" className="text-lg font-medium text-[#cccccc]">Home</Link>
          <Link href="/contact" className="text-lg font-medium text-[#cccccc]">Contact us</Link>
          <hr className="border-white/10" />
          <Link href={"/login"} className="text-left font-medium text-[#cccccc]">Login</Link>
          {/* <button className="w-full py-3 bg-white rounded-lg font-bold text-[#171717]">Get Started</button> */}
        </div>
      )}
    </nav>
  );
}