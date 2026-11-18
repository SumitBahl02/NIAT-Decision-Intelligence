import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIAT Decision Intelligence | AI Family Advisor & Admissions Engine",
  description:
    "An objective, multilingual AI advisory platform for students and parents considering the 4-year NIAT on-campus software engineering & B.Tech degree programme. Get verified facts on fees, university partnerships, and placements.",
  keywords: [
    "NIAT",
    "NxtWave",
    "NIAT decision intelligence",
    "B.Tech Computer Science",
    "NIAT fee structure",
    "NIAT admissions",
    "NIAT admissions 2026",
    "EdTech India",
  ],
  authors: [{ name: "NIAT Growth Architecture Team" }],
  openGraph: {
    title: "NIAT Decision Intelligence — AI Family Advisor",
    description:
      "Explore the NIAT 4-year on-campus programme with unbiased AI guidance in English, Telugu, Hindi, Tamil, Kannada, and Malayalam.",
    type: "website",
    locale: "en_IN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
