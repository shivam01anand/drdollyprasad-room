import type { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";
import { HOME_CARD } from "@/lib/og";

const DESCRIPTION =
  "Dr Dolly Prasad paints the everyday, held sacred, mostly in oil in New Delhi. Her paintings are in private collections in India, the USA and the UK.";

export const metadata: Metadata = {
  metadataBase: new URL("https://drdollyprasad.com"),
  title: { default: "Dr Dolly Prasad · Paintings · The everyday, held sacred", template: "%s · Dr Dolly Prasad" },
  description: DESCRIPTION,
  // the link preview when the site is shared (WhatsApp, Instagram, mail)
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dr Dolly Prasad",
    title: "Dr Dolly Prasad",
    description: DESCRIPTION,
    locale: "en_IN",
    images: [HOME_CARD],
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
