import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E0E10",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://golivra.app"),
  title: "LIVRA — La transaction protégée des deux côtés",
  description:
    "LIVRA protège chaque livraison des deux côtés : le vendeur est protégé des faux clients (score de fiabilité, OTP de réception), l'acheteur est protégé des arnaques (validation de commande, suivi live).",
  icons: {
    icon: [
      { url: "/favicon.ico",       sizes: "any" },
      { url: "/favicon.svg",       type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title:       "LIVRA — La transaction protégée des deux côtés",
    description: "Le vendeur est protégé des faux clients, l'acheteur est protégé des arnaques. Score de fiabilité, OTP de réception, validation et suivi live.",
    images: [{ url: "/og-image-livra.png", width: 1200, height: 630, alt: "LIVRA" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "LIVRA — La transaction protégée des deux côtés",
    description: "Le vendeur est protégé des faux clients, l'acheteur est protégé des arnaques. Score de fiabilité, OTP de réception, validation et suivi live.",
    images:      ["/og-image-livra.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
