import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], display: "swap" });

export const metadata: Metadata = {
  title: "בדיקת טכניקה ממאמן, בהתאם לפציעה שלך",
  description: "מצלמים סט אחד, כותבים מה כואב, ומקבלים משוב ממאמן תוך 24 שעות.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
