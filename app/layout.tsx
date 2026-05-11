import type { Metadata } from "next";
import { JetBrains_Mono, Crimson_Text, Inter } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "L'INTERPRÉTEUR — terminal d'agent",
  description: "Plateforme de coordination des Compilateurs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${jetbrains.variable} ${crimson.variable} ${inter.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
