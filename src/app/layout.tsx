import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainnetBanner } from "@/components/layout/MainnetBanner";

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const heading = Unbounded({
  variable: "--font-heading-face",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "700", "900"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "morse · blog - decentralized publishing on Sui",
  description:
    "A demo blog you actually own. Built on @arcadiasystems/morse-sdk with Walrus storage and Seal encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <MainnetBanner />
          <Header />
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
