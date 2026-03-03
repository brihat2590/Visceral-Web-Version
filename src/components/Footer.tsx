import React from "react";
import { Youtube,X,Instagram,Linkedin } from "lucide-react";


const socialLinks = [
  { label: "YouTube", icon: <Youtube />, href: "#" },
  { label: "Twitter", icon: <X />, href: "#" },
  { label: "Instagram", icon: <Instagram />, href: "#" },
  { label: "LinkedIn", icon: <Linkedin/>, href: "#" },
];

const navLinks = [
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Refund & Cancellation", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0a] overflow-hidden w-full">
      {/* Top Section */}
      <div className="relative z-10 flex flex-col md:flex-row  md:items-start justify-between px-14 pt-12 pb-10 gap-10 md:gap-10">
        {/* Logo */}
        <div className="text-white text-xl font-black tracking-tight">
          <img src={"/visceral_logo.jpg"} alt="Visceral Logo" className="h-10 w-auto" />
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col   md:items-start   gap-3.5">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#cccccc] text-sm font-normal hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Social Icons + Copyright */}
        <div className="flex flex-col md:items-end gap-4">
          <div className="flex gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-11 h-11 rounded-xl bg-[#1a1a1a]   text-[#cccccc] flex items-center justify-center hover:bg-[#252525] hover:border-[#ffffff]hover:text-[#ffffff] transition-all duration-200"
              >
                {social.icon}
              </a>
            ))}
          </div>
          <p className="text-sm hover:text-white text-[#cccccc] cursor-pointer">
            © 2026 VISCERAL. All rights reserved.
          </p>
        </div>
      </div>

      {/* Watermark */}
      <div
        className="relative  w-full z-0  leading-none select-none pointer-events-none  "
        aria-hidden="true"
      >
        <span
          className="font-black flex items-center justify-center bg-gradient-to-b from-neutral-300 via-neutral-700 to-black bg-clip-text text-transparent  tracking-tighter text-[70px] md:text-[clamp(140px,18vw,300px)] "
        //   style={{
        //     fontSize: "clamp(140px, 18vw, 300px)",
            
        //   }}
        >
          VISCERAL
        </span>
      </div>
    </footer>
  );
}