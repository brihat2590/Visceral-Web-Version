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
      <div className="relative z-10 flex flex-col justify-between gap-10 px-14 pb-10 pt-12 md:flex-row md:items-start md:gap-10">
        <div className="text-xl font-black tracking-tight text-white">
          <div className="inline-block bg-white px-2 py-1 italic text-black">VISCERAL</div>
        </div>

        <nav className="flex flex-col gap-3.5 md:items-start">
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

        <div className="flex flex-col md:items-end gap-4">
          <div className="flex gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-11 h-11 rounded-xl bg-[#1a1a1a] text-[#cccccc] flex items-center justify-center transition-all duration-200 hover:bg-[#252525] hover:text-[#ffffff]"
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

      <div className="relative z-0 w-full select-none leading-none pointer-events-none" aria-hidden="true">
        <span
          className="flex items-center justify-center bg-gradient-to-b from-neutral-300 via-neutral-700 to-black bg-clip-text text-[70px] font-black tracking-tighter text-transparent md:text-[clamp(140px,18vw,300px)]"
        >
          VISCERAL
        </span>
      </div>
    </footer>
  );
}