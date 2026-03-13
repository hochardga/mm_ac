import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DemoEnvironmentBanner } from "@/components/demo-environment-banner";
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
  title: "Ashfall Collective",
  description: "Report to your handler. First cases incoming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DemoEnvironmentBanner />
        {children}
      </body>
    </html>
  );
}
