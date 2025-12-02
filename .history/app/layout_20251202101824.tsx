import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Task Evaluator",
  description:
    "Mini SaaS that reviews coding tasks with AI-powered feedback and secure payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-transparent antialiased text-slate-900`}
      >
        <div className="min-h-screen">
          <div className="bg-slate-950/30 border-b border-white/6">
            <header className="container-xl">
              {/* Nav loaded client-side to keep layout fast */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
            </header>
          </div>
          <div className="container-xl">
            {children}
          </div>
      </body>
    </html>
  );
}
