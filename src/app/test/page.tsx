import HeroContent from "@/components/HeroContent";
import Navbar from "@/components/LandingNav";
import  { VisceralFeaturesSection } from "@/components/FeaturesSection"
import { HowItWorksSection } from "@/components/HowItWorks";

export default function Test() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      
      {/* Background Video Wrapper - Now Responsive */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[140vw] lg:w-[110vw]" 
        style={{ 
          top: '-10%', // Pulled up to sit behind Hero text
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none' // Ensures video doesn't block clicks
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            opacity: 0.6, // Slightly lowered for better text readability
            /* Updated Mask: 
               Stretched the circle into an ellipse to cover more horizontal width 
            */
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          {/* Note: Ensure this URL leads to a direct .mp4 file */}
          <source src="https://www.pexels.com/download/video/9694807/" type="video/mp4" />
        </video>

        {/* Enhanced Dynamic Glow */}
        <div
          className="absolute inset-x-0 top-1/4 bottom-1/4 -z-10 bg-zinc-800/20 blur-[160px] rounded-full"
          aria-hidden="true"
        />
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