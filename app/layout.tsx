import type { Metadata, Viewport } from "next";
import WELCOME_FONTS from "@/lib/welcome-fonts.json";
import "./fonts.css";
import "./globals.css";

const DESCRIPTION =
  "Paintings by Dr Dolly Prasad — a doctor who paints. Oil on canvas, New Delhi. Eighteen solo exhibitions; work in private collections in India, the USA, New York and London.";

export const metadata: Metadata = {
  metadataBase: new URL("https://drdollyprasad.com"),
  title: "Dr Dolly Prasad · Paintings, New Delhi",
  description: DESCRIPTION,
  // the link preview when the site is shared (WhatsApp, Instagram, mail)
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dr Dolly Prasad",
    title: "Dr Dolly Prasad",
    description: DESCRIPTION,
    locale: "en_IN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Threads of Faith, oil on canvas, by Dr Dolly Prasad" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#EFE9DF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        {WELCOME_FONTS.filter((href) => href.includes("instrument-sans") || href.includes("ibm-plex-mono"))
          .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      </head>
      <body>{children}</body>
    </html>
  );
}
