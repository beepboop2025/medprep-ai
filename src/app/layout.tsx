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
  title: "MedPrep AI",
  description:
    "AI-powered medical exam preparation with 4,000+ MCQs across 21 subjects. Powered by Claude.",
  keywords: [
    "medical exam",
    "USMLE",
    "NEET-PG",
    "PLAB",
    "MCQ",
    "AI tutor",
    "medical education",
  ],
  openGraph: {
    title: "MedPrep AI — Medical Exam Study Agent",
    description:
      "Practice 4,000+ medical MCQs with an AI tutor powered by Claude. Covers 21 subjects from Anatomy to Surgery.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
