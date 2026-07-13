import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import Header from "@/components/site/header";
import Footer from "@/components/site/footer";
import { CartDrawer } from "@byki/core/commerce";
import { BIZ, SITE_URL } from "@/lib/site-config";
import { autoRepairJsonLd } from "@/lib/structured-data";

// Self-hosted Exo 2 (variable font, weights 100–900) — primary sans.
const exo2 = localFont({
  src: [
    { path: "./fonts/Exo2-VariableFont_wght.ttf", weight: "100 900", style: "normal" },
    { path: "./fonts/Exo2-Italic-VariableFont_wght.ttf", weight: "100 900", style: "italic" },
  ],
  variable: "--font-exo",
  display: "swap",
});

// Instrument Serif — elegant italic accent for emphasis words (editorial mix).
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IM Dynamic Torque — Pakar Transmisi Auto & CVT | Imbas Kod Kerosakan",
    template: "%s | IM Dynamic Torque",
  },
  description:
    "Imbas kod kerosakan kereta percuma & tempah slot pembaikan RM10. Pakar transmisi auto & CVT, towing dan servis harian.",
  keywords: [
    "servis gearbox",
    "pakar transmisi auto",
    "servis CVT",
    "imbas kod kerosakan kereta",
    "overhaul gearbox",
    "towing kereta",
    "tempah slot servis kereta",
    "IM Dynamic Torque",
  ],
  authors: [{ name: BIZ.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: SITE_URL,
    siteName: BIZ.name,
    title: "IM Dynamic Torque — Pakar Transmisi Auto & CVT",
    description:
      "Imbas kod kerosakan kereta percuma terus dari telefon. Tempah slot pembaikan RM10. Pakar gearbox auto & CVT.",
    images: [{ url: "/logo.jpg", width: 1600, height: 1600, alt: BIZ.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IM Dynamic Torque — Pakar Transmisi Auto & CVT",
    description: "Imbas kod kerosakan kereta percuma & tempah slot pembaikan RM10.",
    images: ["/logo.jpg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo-mark.jpg", apple: "/logo-mark.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms" className={`${exo2.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(autoRepairJsonLd()) }}
        />
        <Header />
        {children}
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
