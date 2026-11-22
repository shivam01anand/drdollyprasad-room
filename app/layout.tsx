import type { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";

const DESCRIPTION =
  "Dr Dolly Prasad is a doctor and painter in New Delhi who works mostly in oil on canvas, sometimes with charcoal or pastel. Nineteen exhibitions and art fairs since 2005; paintings in private collections in India, the USA and the UK.";

export const metadata: Metadata = {
  metadataBase: new URL("https://drdollyprasad.com"),
  title: { default: "Dr Dolly Prasad · Paintings, New Delhi", template: "%s · Dr Dolly Prasad" },
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
  themeColor: "#F5F4F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** the website (app/(site)) and the studio (app/studio) each bring their own fonts and styles */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>{children}<Analytics /></body>
    </html>
  );
}
