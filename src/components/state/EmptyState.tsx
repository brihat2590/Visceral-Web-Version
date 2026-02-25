"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";

export default function EmptyState() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-black items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* Icon */}
        <Link href="/market-screen" className="mb-6">
          <div className="border border-white border-dashed rounded-full p-5 hover:opacity-80 transition">
            <IoCloseOutline size={40} color="white" />
          </div>
        </Link>

        {/* Title */}
        <h2 className="text-white text-2xl font-bold tracking-tight mb-2">
          INACTIVE
        </h2>

        {/* Message */}
        <p className="text-zinc-500 text-center text-base italic max-w-sm">
          “Our data streams are currently unresponsive. We’re working to restore
          the connection—thank you for your patience.”
        </p>

        {/* Hint */}
        <div className="mt-12 border-t border-zinc-800 pt-4">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">
            Tap the X to retreat
          </p>
        </div>
      </motion.div>
    </div>
  );
}