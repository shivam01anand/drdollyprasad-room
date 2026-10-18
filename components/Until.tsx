"use client";

import { useEffect, useState } from "react";

/**
 * Shown only until the end of `until` (YYYY-MM-DD, New Delhi). It is drawn
 * with the page, so nothing jumps when the page loads (layout shift); a
 * visitor's browser removes it once the date has passed, and the next
 * deployment leaves it out.
 */
const over = (until: string) => Date.now() >= Date.parse(`${until}T23:59:59+05:30`);

export default function Until({ until, children }: { until: string; children: React.ReactNode }) {
  const [on, setOn] = useState(() => !over(until));
  useEffect(() => { if (over(until)) setOn(false); }, [until]);
  return on ? <>{children}</> : null;
}
