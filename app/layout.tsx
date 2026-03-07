import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased bg-[#0A0F1F] text-gray-200`}
      >
        {children}
      </body>
    </html>
  );
}
