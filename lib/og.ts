import type { Metadata } from "next";

/**
 * The link preview of a page (WhatsApp, iMessage, mail): its own title, description and address.
 * A page that sets `openGraph` replaces the root one whole (app/layout.tsx), so the shared parts
 * (site name, locale, the card picture) are repeated here.
 */
export const HOME_CARD = { url: "/og.jpg", width: 1200, height: 630, alt: "Threads of Faith, oil on canvas, by Dr Dolly Prasad" };

export const pageOg = (title: string, description: string, url: string): NonNullable<Metadata["openGraph"]> => ({
  type: "website", url, siteName: "Dr Dolly Prasad", title: `${title} · Dr Dolly Prasad`, description, locale: "en_IN", images: [HOME_CARD],
});
