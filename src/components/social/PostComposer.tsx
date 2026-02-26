"use client";
import { toast } from "sonner";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Loader2 } from "lucide-react";

const supabase = createClient();

export default function PostComposer({ onPost }: { onPost: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransmit = async () => {
    // 1. Validation
    if (!user) return toast.error("You must be logged in to transmit.");
    if (!title.trim() || !content.trim()) return alert("Fields cannot be empty.");

    setIsSubmitting(true);

    try {
      // 2. Insert into 'posts' table using your specific columns
      const { error } = await supabase
        .from("posts")
        .insert([
          {
            title: title,
            post: content,     // Your table uses 'post' for the description
            user_id: user.id,  // Linking the post to the current user
          },
        ]);

      if (error) throw error;

      // 3. Success State
      toast.success("Signal Transmitted Successfully"); // Replace with toast.success if available
      setTitle("");
      setContent("");
      
      // 4. Refresh the feed in the parent component
      onPost(); 

    } catch (error: any) {
      console.error("TRANSMISSION_ERROR:", error.message);
      toast.error("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
      <input
        type="text"
        placeholder="SIGNAL_TITLE"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent border-b border-zinc-900 pb-2 text-xl font-black uppercase italic outline-none focus:border-white transition-colors"
      />
      <textarea
        placeholder="Enter your transmission details..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full bg-transparent text-zinc-400 text-sm leading-relaxed outline-none min-h-[100px] resize-none"
      />
      <div className="flex justify-end pt-4">
        <button
          onClick={handleTransmit}
          disabled={isSubmitting}
          className="flex items-center gap-3 bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
          Transmit
        </button>
      </div>
    </div>
  );
}