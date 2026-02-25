import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";
import VisceralSidebar from "@/components/VisceralSidebar";

// app/layout.tsx



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visceral",
  description: "Gamified Trading Platform",
  icons:{
    icon:"/visceral_logo.ico"
  }
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${geistMono.variable} antialiased`}
      >
        <Toaster/>
       
        {children}
        <Footer/>
      </body>
    </html>
  );
}
