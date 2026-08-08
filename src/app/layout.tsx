import type { Metadata } from "next";
import { Fraunces, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { Disclaimer } from "@/components/Disclaimer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGB Tracker — find gold bonds cheaper than gold",
  description:
    "Plain-language guide to Sovereign Gold Bonds on the stock exchange: see which trade cheaper than gold, with clear buy/skip signals. Not investment advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <div className="relative z-10 flex min-h-full flex-col">
          <SiteNav />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            {children}
          </main>
          <Disclaimer />
        </div>
      </body>
    </html>
  );
}
