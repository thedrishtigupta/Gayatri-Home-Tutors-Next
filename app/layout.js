// app/layout.js — root layout (SSG-compatible, no client state here)

import { Outfit, Viga } from "next/font/google";
import "@/styles/style.css";      // ← first
import "@/styles/responsive.css"; // ← second
import "@/styles/admin.css";      // ← third
import "@/styles/globals.css";    // ← last

const outfit = Outfit({
  subsets: ["latin"],
  weight:  ["100","300","400","500","600","700","800","900"],
  variable: "--font-outfit",
  display: "swap",
});
const viga = Viga({
  subsets: ["latin"],
  weight:  ["400"],
  variable: "--font-viga",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gayatrihometutors.com"),
  title: {
    default: "Gayatri Home Tutors | Home Tuition in Delhi NCR",
    template: "%s | Gayatri Home Tutors",
  },
  description:
    "Gayatri Home Tutors connects students across Delhi NCR with qualified, verified home tutors for all subjects and classes. Book a free demo today!",
  keywords: [
    "home tutors delhi ncr","home tuition rohini","home tuition pitampura",
    "maths tutor delhi","science tutor delhi","home tutor near me",
    "best home tutors delhi","gayatri home tutors",
  ],
  openGraph: {
    type:        "website",
    locale:      "en_IN",
    url:         "/",
    siteName:    "Gayatri Home Tutors",
    title:       "Gayatri Home Tutors | Home Tuition in Delhi NCR",
    description: "Personalized home tuition for students across Delhi NCR since 2010.",
    images: [{ url: "/assets/images/og-image.jpg", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${viga.variable}`}>
      <body>{children}</body>
    </html>
  );
}
