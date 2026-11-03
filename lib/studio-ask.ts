/** Where "Ask about this painting" goes: the enquiry form, with the painting chosen.
 *  Clicks on these links are counted by lib/analytics-interactions.ts (enquiry_clicked, with the painting). */
export const askPath = (id?: string) => (id ? `/enquire?work=${encodeURIComponent(id)}` : "/enquire");
