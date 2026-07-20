import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import { Providers } from "@morse/shared/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainnetBanner } from "@morse/shared/components/layout/MainnetBanner";
import { ThemeProvider } from "@morse/shared/components/layout/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "morse · clean — decentralized publishing on Sui",
  description:
    "Clean/Modern template for Morse. Lightweight, professional publishing on Sui with Walrus storage and Seal encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      style={{
        "--font-heading-face": "var(--font-sans)",
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('morse-theme');if(t==='dark'||(t==null&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-muted antialiased">
        <Providers>
          <ThemeProvider>
            <MainnetBanner />
            <Header />
            <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
