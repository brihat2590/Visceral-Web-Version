# Visceral Web

Visceral is a Next.js app for a trading education and paper-trading experience. The landing page presents the product with a monochrome SaaS-style layout, while the rest of the app contains auth, dashboard, and product flows.

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS v4
- Supabase
- Sonner for toasts

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file with the values required by the app, including:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Project Structure

- `src/app` - app routes and layouts
- `src/components` - shared UI components
- `src/lib` - utilities and Supabase helpers
- `src/api` - API helpers
- `public` - static assets

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the app
- `npm run start` - run the production server
- `npm run lint` - run ESLint
