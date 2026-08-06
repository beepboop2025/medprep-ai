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
    "Practice 4,183 MedMCQA questions across 21 subjects with an optional retrieval-grounded tutor.",
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
    title: "MedPrep AI | MedMCQA exam practice",
    description:
      "Practice 4,183 MedMCQA questions across 21 subjects. The optional tutor uses retrieved question context.",
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
