"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserOnboardingState } from "@/lib/supabase/onBoarding";
import { toast } from "sonner";

const EXPERIENCE_OPTIONS = [
  { value: "New",            label: "New to Markets" },
  { value: "Some exposure",  label: "Some Exposure" },
  { value: "Active learner", label: "Active Learner" },
] as const;

type ExperienceValue = (typeof EXPERIENCE_OPTIONS)[number]["value"];

export default function MarketExperiencePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<ExperienceValue | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExperienceSubmit = async (selectedExperience: ExperienceValue) => {
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
        .update({ experience: selectedExperience })
        .eq("id", user.id);

      if (error) throw error;

      router.push("/first-entry");
    } catch (error: any) {
      toast.error("Unable to continue", { 
        description: error.message || "Please try again." 
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
      {/* Optimized max-width for PC focus */}
      <div className="w-full max-w-[550px] mx-auto flex-1 flex flex-col px-6 py-12 md:py-24">
        
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Your experience with <br />
            <span className="text-neutral-500">markets?</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            This helps us calibrate the complexity of your workspace.
          </p>
        </header>

        {/* Options - Clean vertical stack */}
        <div className="mt-12 flex flex-col gap-3">
          {EXPERIENCE_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`
                  group relative w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200 border
                  ${isSelected 
                    ? "bg-white border-white translate-x-1 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
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
                  
                  {/* Minimalism Indicator */}
                  <div className={`
                    h-2 w-2 rounded-full transition-all
                    ${isSelected ? "bg-black scale-125" : "bg-transparent border border-neutral-700"}
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
            onClick={() => selected && handleExperienceSubmit(selected)}
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
              <span className="animate-pulse tracking-wide">SETTING UP...</span>
            ) : (
              "FINISH"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}