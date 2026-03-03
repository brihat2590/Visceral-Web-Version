"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserOnboardingState } from "@/lib/supabase/onBoarding";
import { toast } from "sonner";

const INTENT_OPTIONS = [
  { value: "Learn before using real money", label: "Learn before using real money" },
  { value: "Understand my decisions",       label: "Understand my decisions" },
  { value: "Practice without pressure",     label: "Practice without pressure" },
  { value: "Explore how markets work",      label: "Explore how markets work" },
] as const;

type IntentValue = (typeof INTENT_OPTIONS)[number]["value"];

export default function IntentCreationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<IntentValue | null>(null);
  const [loading, setLoading] = useState(false);

  const handleIntentSubmit = async (selectedIntent: IntentValue) => {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      await getUserOnboardingState(supabase);
      
      const { error } = await supabase
        .from("users")
        .update({ intent: selectedIntent })
        .eq("id", user.id);

      if (error) throw error;
      
      router.push("/market-experience");
    } catch (error: any) {
      toast.error("Unable to continue", { 
        description: error.message || "Please try again." 
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
      {/* Container restricted to 550px for that modern 'centered' web app feel */}
      <div className="w-full max-w-[550px] mx-auto flex-1 flex flex-col px-6 py-12 md:py-24">
        
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Why are you <span className="text-neutral-500">here?</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Choose the path that best fits your goals.
          </p>
        </header>

        {/* Options - Single column stack (Grid 1x1) */}
        <div className="mt-12 flex flex-col gap-3">
          {INTENT_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`
                  group relative w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200 border
                  ${isSelected 
                    ? "bg-white border-white translate-x-1" 
                    : "bg-transparent border-neutral-800 hover:border-neutral-500"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={`
                    text-base md:text-lg font-medium transition-colors duration-200
                    ${isSelected ? "text-black" : "text-neutral-400 group-hover:text-neutral-200"}
                  `}>
                    {option.label}
                  </span>
                  
                  {/* Minimalism: Only show a small indicator if selected */}
                  <div className={`
                    h-2 w-2 rounded-full transition-all
                    ${isSelected ? "bg-black scale-125" : "bg-transparent"}
                  `} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer / Action */}
        <div className="mt-auto pt-16">
          <button
            disabled={!selected || loading}
            onClick={() => selected && handleIntentSubmit(selected)}
            className={`
              w-full h-14 md:h-16 rounded-xl font-bold text-base transition-all duration-300
              flex items-center justify-center gap-2
              ${selected && !loading
                ? "bg-white text-black active:scale-[0.98] hover:bg-neutral-200"
                : "bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800"
              }
            `}
          >
            {loading ? (
              <span className="animate-pulse tracking-wide">INITIALIZING...</span>
            ) : (
              "CONTINUE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}