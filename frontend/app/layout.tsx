import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import { AuthProvider } from "@/components/auth-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NuqsProvider } from "@/components/nuqs-provider";
import { QueryProvider } from "@/components/query-provider";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Terrify — Terrenos en Jalisco",
    template: "%s | Terrify",
  },
  description:
    "Explora, compara y publica terrenos en Zacoalco de Torres y toda la región de Jalisco. Sin fricción, sin registrarte.",
  keywords: ["terrenos", "Jalisco", "Zacoalco de Torres", "comprar terreno", "vender terreno", "Terrify"],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Terrify",
    title: "Terrify — Terrenos en Jalisco",
    description: "Explora terrenos disponibles en tu zona. Revisa fotos, precio y ubicación antes de decidir.",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <QueryProvider>
            <NuqsProvider>
              {children}
            </NuqsProvider>
          </QueryProvider>
          <SiteFooter />
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
