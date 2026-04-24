import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "../components/Providers";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import ThemePreviewListener from "../components/ThemePreviewListener";
import GlobalHeader from "../components/GlobalHeader";
import AdBanner from "../components/AdBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Trampo 💼 — Mural de Vagas e Oportunidades",
    template: "%s — Trampo",
  },
  description: "Publique vagas de emprego e serviços freelancer diretamente na comunidade do Discord. Grátis, open source e seguro.",
  keywords: ["vagas de emprego", "freelancer", "discord", "comunidade", "trampo", "oportunidades", "ti", "tecnologia"],
  authors: [{ name: "Wilson Teofilo", url: "https://github.com/WilsonTeofilo" }],
  creator: "Wilson Teofilo",
  openGraph: {
    title: "Trampo — Mural de Vagas para Discord",
    description: "Plataforma open source de vagas e freelancers integrada ao Discord.",
    type: "website",
    url: BASE_URL,
    siteName: "Trampo",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Trampo — Mural de Vagas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trampo — Mural de Vagas para Discord",
    description: "Plataforma open source de vagas e freelancers integrada ao Discord.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeProvider>
          <ThemePreviewListener />
          <Providers>
            {/* Header global — aparece em todas as páginas */}
            <GlobalHeader />

            {children}

            {/* Banner de anúncio flutuante — aparece em todas as páginas */}
            <AdBanner variant="float" />
          </Providers>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
