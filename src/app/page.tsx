import HeroContent from "@/components/HeroContent";
import Navbar from "@/components/LandingNav";
import  { VisceralFeaturesSection } from "@/components/FeaturesSection"
import { HowItWorksSection } from "@/components/HowItWorks";

export const metadata = {
  title: "Paper Trading Platform",
  description:
    "Learn trading with live market simulation, reflection tools, and competitive leagues in the Visceral paper trading platform.",
};

export default function VisceralLanding() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute left-1/2 top-[-10%] h-screen w-[110vw] -translate-x-1/2 pointer-events-none">
        <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-neutral-900/40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,0,0,1)_0%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,0,0,1)_0%,rgba(0,0,0,0)_100%)]" />
          <div className="absolute inset-x-0 top-1/4 bottom-1/4 -z-10 rounded-full bg-zinc-800/20 blur-[160px]" aria-hidden="true" />
        </div>
      </div>

      <div className="relative z-10">
        <Navbar />
        <HeroContent />
        <HowItWorksSection/>
        <VisceralFeaturesSection/>
      </div>
    </div>
  );
}