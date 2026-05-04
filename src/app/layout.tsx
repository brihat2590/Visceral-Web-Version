import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";

// app/layout.tsx



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://visceral-be.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Visceral",
    template: "%s | Visceral",
  },
  description:
    "Visceral is a paper trading and market education platform built to help traders learn through live market simulation, reflection, and leagues.",
  keywords: [
    "Visceral",
    "paper trading",
    "trading education",
    "market simulation",
    "virtual trading",
    "trading leagues",
    "stock market app",
  ],
  applicationName: "Visceral",
  authors: [{ name: "Visceral" }],
  creator: "Visceral",
  publisher: "Visceral",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Visceral",
    description:
      "Paper trading, market reflection, and competitive leagues in one polished trading education platform.",
    url: siteUrl,
    siteName: "Visceral",
    images: [
      {
        url: "/visceral_logo.jpg",
        width: 1200,
        height: 630,
        alt: "Visceral",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visceral",
    description:
      "Paper trading, market reflection, and competitive leagues in one polished trading education platform.",
    images: ["/visceral_logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/visceral_logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${geistMono.variable} antialiased bg-black text-white`}
      >
        <Toaster/>
       
        {children}
        <Footer/>
      </body>
    </html>
  );
}
