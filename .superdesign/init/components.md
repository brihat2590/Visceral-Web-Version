# Components Inventory

## LandingNav.tsx
- Path: `src/components/LandingNav.tsx`
- Client component using `useState`, `next/link`, and `lucide-react` menu icons
- Renders the Visceral logo image from `public/visceral_logo.jpg`
- Desktop links: Home, Contact us, Login
- Mobile menu drawer with black background and white text
- Visual style: dark nav, muted gray text, white hover state

## HeroContent.tsx
- Path: `src/components/HeroContent.tsx`
- Client component with CTA buttons and a terminal/dashboard preview block
- Uses `ArrowRight`, `Play`, and `Terminal` icons from `lucide-react`
- Includes a brand badge with red accent bar and a grayscale image mockup
- Visual style: high-contrast, oversized headline, black surface, white CTA

## HowItWorks.tsx
- Path: `src/components/HowItWorks.tsx`
- Client component with motion-driven step tabs and animated panel content
- Uses `motion/react`, `AnimatePresence`, and `cn` utility
- Contains three visual states: signup, league, reflect
- Visual style: black section, white borders, monochrome cards, uppercase labels

## FeaturesSection.tsx
- Path: `src/components/FeaturesSection.tsx`
- Client component with a large left marketing card and stacked right cards
- Uses uppercase headline, bullets, and small proof text
- Visual style: black cards, white borders, gray copy, some legacy red-free content

## Footer.tsx
- Path: `src/components/Footer.tsx`
- Server-compatible footer with logo, legal links, social icons, and watermark wordmark
- Uses `lucide-react` social icons and the `public/visceral_logo.jpg` asset
- Visual style: dark footer, muted links, large translucent brand wordmark

## VisceralSidebar.tsx
- Path: `src/components/VisceralSidebar.tsx`
- Dashboard shell sidebar, client component with Supabase auth state and navigation
- Uses `next/navigation`, `next/link`, `sonner`, and several `lucide-react` icons
- Not part of the landing page, but it defines the app's wider dark-shell language
