/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Root layout for the root-level demo app (fonts + global wrappers).
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import PageTransition from "./components/PageTransition";
import Footer from "./components/Footer";
import { AuthProvider } from "@/lib/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriSentinel AI | AI-Powered Smart Farming Intelligence",
  description: "AI-Powered Smart Farming Intelligence Platform — Crop disease detection, yield prediction, smart mandi recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${geistMono.variable} ${geistSans.variable} font-sans antialiased bg-[#0A0F1F] text-gray-200`}
      >
        <AuthProvider>
          <Navbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
