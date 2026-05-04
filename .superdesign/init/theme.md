# Theme

## Current Technical Theme
- Tailwind CSS v4 via `src/app/globals.css`
- CSS variables define the token system for background, foreground, border, muted, accent, and sidebar colors
- Root app currently uses light token defaults with a dark `.dark` override
- Landing components override most colors directly with Tailwind utility classes

## Current Visual Theme
- Predominantly black backgrounds
- White and gray text
- Thin white or zinc borders
- Some red accent usage in hero/process labels
- Premium but aggressive, closer to a trading brand than a SaaS marketing site

## Fonts
- `Geist` and `Geist_Mono` are loaded in `src/app/layout.tsx`
- Landing sections also use inline font-family overrides in places
- For the SaaS restyle, keep typography strong and legible, but prioritize hierarchy over novelty

## Spacing and Radius
- Sections use generous vertical spacing (`py-24`, `py-40`, etc.)
- Cards and panels use medium rounding or sharp corners depending on section intent
- Borders are usually 1px and low-contrast

## Color Guidance for the New Landing Direction
- Use black, white, and a controlled grayscale ramp only
- Prefer `zinc`, `neutral`, or custom gray utilities for secondary information
- Use one accent only if absolutely necessary, and keep it neutral rather than colorful
- Avoid red glow, neon gradients, and saturated imagery treatments
