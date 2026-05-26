import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "LIVRA — Gestion de commandes",
  description:
    "SaaS de gestion de commandes pour e-commerçants algériens. Suivez vos commandes, clients et livraisons avec les 58 wilayas intégrées.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans h-full bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
