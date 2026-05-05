import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppPreferencesProvider } from "../components/app-preferences";
import { AppHeader } from "../components/app-header";
import { BackgroundTitle } from "../components/background-title";
import { StarsCanvas } from "@/components/ui/stars-canvas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gaming Hub",
  description: "Plateforme de jeux, catalogue et compte joueur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      data-theme="dark"
    >
      <body className="relative flex min-h-full flex-col overflow-x-hidden">
        <AppPreferencesProvider>
          <div className="galaxy-bg fixed inset-0 z-0" aria-hidden>
            <StarsCanvas className="opacity-100" maxStars={2000} speedMultiplier={0.072} twinkleIntensity={40} />
            <div className="galaxy-nebula galaxy-nebula-a" />
            <div className="galaxy-nebula galaxy-nebula-b" />
          </div>
          <BackgroundTitle />
          <AppHeader />
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </AppPreferencesProvider>
      </body>
    </html>
  );
}
