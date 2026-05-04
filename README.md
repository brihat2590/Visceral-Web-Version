# Visceral Web

Visceral is a modern web platform for trading education and paper trading, empowering users to learn, practice, and improve their trading performance without risk.It provides a simulated trading environment that mirrors real market conditions, allowing users to test strategies and gain hands-on experience without financial exposure. The platform focuses on building strong fundamentals, helping users understand market behavior, risk management, and disciplined decision-making.

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
