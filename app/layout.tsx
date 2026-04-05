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

import { ServiceWorkerRegistration } from "./components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "AgriSentinel AI | AI-Powered Smart Farming Intelligence",
  description: "AI-Powered Smart Farming Intelligence Platform — Crop disease detection, yield prediction, smart mandi recommendations.",
  manifest: "/manifest.json",
  themeColor: "#00FF9C",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgriSentinel AI",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'en,hi,mr', autoDisplay: false}, 'google_translate_element');
              }
            `,
          }}
        />
        <script
          type="text/javascript"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          async
        ></script>
      </head>
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${geistMono.variable} ${geistSans.variable} font-sans antialiased bg-[#0A0F1F] text-gray-200`}
      >
        <div id="google_translate_element" className="hidden"></div>
        <AuthProvider>
          <ServiceWorkerRegistration />
          <Navbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
