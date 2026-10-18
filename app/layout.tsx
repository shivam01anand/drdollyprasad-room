import type { Metadata, Viewport } from "next";

const DESCRIPTION =
  "Dr Dolly Prasad is a New Delhi artist who makes the everyday memorable: oil paintings of a changing India, its waiting and wishing, its worship and whispers. Eighteen exhibitions and art fairs; collectors in India, the USA and London.";

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
  themeColor: "#FBF9F5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** the website (app/(site)) and the studio (app/studio) each bring their own fonts and styles */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>{children}</body>
    </html>
  );
}
