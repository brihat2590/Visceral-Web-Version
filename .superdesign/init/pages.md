# Page Dependency Trees

## Landing Page `/`
- `src/app/page.tsx`
- `src/components/LandingNav.tsx`
- `src/components/HeroContent.tsx`
- `src/components/HowItWorks.tsx`
- `src/components/FeaturesSection.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- Assets: `public/visceral_logo.jpg`, `public/visceral_logo.ico`

## Auth Page `/login`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/layout.tsx`

## Auth Page `/signup`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/layout.tsx`

## Dashboard Shell
- `src/app/(dashboard)/layout.tsx`
- `src/components/VisceralSidebar.tsx`
- `src/app/(dashboard)/*/page.tsx`

## Notes
- The landing page is the only route that composes the marketing sections.
- Shared UI primitives are not heavily used in the landing page surface.
- The footer is injected globally from the root layout rather than the page component itself.
