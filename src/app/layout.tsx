import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
