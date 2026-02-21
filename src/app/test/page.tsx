import HeroContent from "@/components/HeroContent";
import Navbar from "@/components/LandingNav";
import  { VisceralFeaturesSection } from "@/components/FeaturesSection"
import { HowItWorksSection } from "@/components/HowItWorks";

export default function Test() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      
      {/* Container to handle the centering and scaling */}
      <div 
        className="absolute left-1/2 -translate-x-1/2"
        style={{ 
          top: '120px', 
          width: '1000px', // Slightly wider than video for the glow
          height: '600px',
          zIndex: 0 
        }}
      >
        {/* The Video with Masking */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            opacity: 0.8,
            /* This mask creates the seamless blend */
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
          }}
        >
          <source src="https://www.pexels.com/download/video/9694807/" type="video/mp4" />
        </video>

        {/* Dynamic Glow: Using a colored or neutral blur behind the video */}
        <div
          className="absolute inset-0 -z-10 bg-neutral-800/30 rounded-full blur-[120px]"
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