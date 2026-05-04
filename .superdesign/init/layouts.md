# Layouts

## Root Layout
- Path: `src/app/layout.tsx`
- Imports `./globals.css`, `Footer`, and `Toaster`
- Sets metadata title `Visceral` and favicon `/visceral_logo.ico`
- Renders all pages inside the root HTML/body shell
- Current body uses Geist Mono variable and antialiased text

## Landing Page Layout
- Path: `src/app/page.tsx`
- Landing page is a single composed route, not a nested layout
- Imports `LandingNav`, `HeroContent`, `HowItWorksSection`, and `VisceralFeaturesSection`
- Current composition is hero-first, then process, then value section
- Page wrapper is a full-height black canvas with overflow hidden

## Dashboard Layout
- Path: `src/app/(dashboard)/layout.tsx`
- Protects the dashboard route group with `getServerUser()` and redirects to login if needed
- Wraps protected routes in `VisceralSidebar`
- Establishes the broader app shell for authenticated pages

## Auth Layout
- Path: `src/app/(auth)/layout.tsx`
- Redirects authenticated users away from auth screens to `/first-entry`
- Wraps login and signup pages in a minimal shell

## Footer Placement
- Footer is mounted globally in `src/app/layout.tsx`
- This means landing-page restyling should account for the footer's black-on-dark visual treatment
