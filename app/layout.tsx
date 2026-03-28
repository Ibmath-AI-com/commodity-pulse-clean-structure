// FILE: src/app/layout.tsx
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { Roboto, Roboto_Condensed, DM_Sans, Playfair_Display } from "next/font/google";
import AppSuspense from "@/app/_components/app-suspense";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata = {
  title: "AI Commodity App",
  description: "Commodity prediction and reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoCondensed.variable} ${dmSans.variable} ${playfairDisplay.variable}`}>
      <body className="tt-body">
        <AppSuspense fallback={null}>{children}</AppSuspense>
      </body>
    </html>
  );
}