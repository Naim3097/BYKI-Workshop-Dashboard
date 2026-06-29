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
    default: "Overhaul In Yard — Pakar Servis & Transmisi Kedah | Imbas Kod Kerosakan",
    template: "%s | Overhaul In Yard",
  },
  description:
    "Pusat servis & transmisi di Sungai Petani, Kedah. Imbas kod kerosakan kereta percuma & tempah slot pembaikan RM10. Pakar gearbox, towing & servis harian sejak 2019.",
  keywords: [
    "servis gearbox Sungai Petani",
    "pakar transmisi Kedah",
    "diagnostik kereta Kedah",
    "imbas kod kerosakan kereta",
    "overhaul gearbox Kedah",
    "towing Sungai Petani",
    "tempah slot servis kereta",
    "Overhaul In Yard",
  ],
  authors: [{ name: BIZ.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: SITE_URL,
    siteName: BIZ.name,
    title: "Overhaul In Yard — Pakar Servis & Transmisi Kedah",
    description:
      "Imbas kod kerosakan kereta percuma terus dari telefon. Tempah slot pembaikan RM10. Pakar gearbox & transmisi di Sungai Petani, Kedah.",
    images: [{ url: "/logo.png", width: 546, height: 120, alt: BIZ.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Overhaul In Yard — Pakar Servis & Transmisi Kedah",
    description: "Imbas kod kerosakan kereta percuma & tempah slot pembaikan RM10.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
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
