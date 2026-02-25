'use client'
import { useState } from "react";
import { Menu, X } from "lucide-react"; // install lucide-react if you haven't
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full max-w-[1440px] mx-auto px-6 md:px-[120px] py-4 h-[102px] flex items-center justify-between relative z-[50]">
      <div className="flex items-center gap-20">
        <img src={"./visceral_logo.jpg"} alt="Visceral Logo" className="h-12 w-auto" />

        {/* Desktop Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/login" className="px-2.5 py-1 text-[#cccccc] hover:text-white font-medium text-sm leading-[22px]" style={{ fontFamily: 'Manrope, sans-serif' }}>Home</Link>
          <Link href="/contact" className="px-2.5 py-1 font-medium text-sm leading-[22px] text-[#cccccc] hover:text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Contact us</Link>
        </div>
      </div>

      {/* Desktop Buttons - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3">
        <Link href={"/login"} className="px-4 py-2 text-[#cccccc] rounded-lg font-semibold text-sm leading-[22px] hover:text-[#ffffff]" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
        <div className="absolute top-[102px] left-0 w-full bg-[#0a0a0a] border-b border-white/10 flex flex-col p-6 gap-6 md:hidden z-50">
          <a href="#" className="text-[#cccccc] text-lg font-medium">Home</a>
          <a href="#" className="text-[#cccccc] text-lg font-medium">Contact us</a>
          <hr className="border-white/10" />
          <Link href={"/login"} className="text-[#cccccc] text-left font-medium">Login</Link>
          {/* <button className="w-full py-3 bg-white rounded-lg font-bold text-[#171717]">Get Started</button> */}
        </div>
      )}
    </nav>
  );
}