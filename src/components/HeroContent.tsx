export default function HeroContent() {
    return (
      <div className="flex flex-col items-center mx-auto max-w-5xl mt-8  relative z-[2]">
        <div className="flex flex-col gap-6">
          <div className="flex mt-10 flex-col gap-2.5 text-center">
          <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter [word-spacing:0.5rem]   text-center">
            
  The market doesn't care.<br/>
  Learn before it teaches you.
</h1>
            <p
              className="text-lg leading-[26px] text-[#f6f7f9] mx-auto max-w-[613px]"
              style={{
                fontFamily: 'Manrope, sans-serif',
                opacity: 0.9
              }}
            >
              Stay ahead of the curve with intelligent insights and real-time market intelligence.
              See yourself clearly in the market's reflection
            </p>
          </div>
  
          <div className="flex items-center justify-center gap-[22px]">
            <button
              className="px-6 py-[14px] bg-white rounded-[10px] text-black font-medium text-base"
              style={{
                fontFamily: 'Cabin, sans-serif',
                lineHeight: 1.7
              }}
            >
              Get Started Free
            </button>
            <button
              className="px-6 py-[14px] bg-transparent border border-white rounded-[10px] text-white font-medium text-base"
              style={{
                fontFamily: 'Cabin, sans-serif',
                lineHeight: 1.7
              }}
            >
              Watch 2min Demo
            </button>
          </div>
        </div>
  
        <div className="mt-20 pb-10 w-full max-w-[1163px] mx-auto px-4" style={{ maxWidth: 'min(1163px, 95vw)' }}>
  <div
    className="relative rounded-[24px] p-[2px] overflow-hidden" // Padded for the "border" effect
    style={{
      /* 1. Subtle glass background */
      
      /* 2. Outer glow to soften the edges against black */
      
    }}
  >
    <div className="rounded-[22px] overflow-hidden bg-black">
      <img
        src="https://images.pexels.com/photos/1108313/pexels-photo-1108313.jpeg"
        alt="Dashboard Preview"
        className="w-full h-auto object-cover opacity-90"
        style={{
          /* 3. The Magic Blend: Fades the bottom of the image into the background */
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
        }}
      />
    </div>
  </div>

        </div>
      </div>
    );
  }
  