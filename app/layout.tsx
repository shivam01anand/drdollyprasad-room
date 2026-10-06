import type { Metadata, Viewport } from "next";
import "./globals.css";

const DESCRIPTION =
  "Paintings by Dr Dolly Prasad — a doctor who paints. Oil on canvas, New Delhi. Eighteen solo exhibitions; work in private collections in India, the USA, New York and London.";

export const metadata: Metadata = {
  metadataBase: new URL("https://drdollyprasad.com"),
  title: "Dr Dolly Prasad",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Devanagari:wght@500&display=swap"
          rel="stylesheet"
        />
        {/* the opening's lamp and its marigolds first: they are the progress */}
        <link rel="preload" as="image" href="/intro/lamp.webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/intro/shadow.webp" />
        {[0, 1, 2, 3, 4, 5].map((k) => <link key={k} rel="preload" as="image" href={`/intro/marigold-${k}.webp`} />)}
        <link rel="preload" as="image" href="/art/large/woman-with-poppies.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
