"use client";

import { useEffect, useState } from "react";

/** shown only until the end of `until` (YYYY-MM-DD, New Delhi), checked in the visitor's browser */
export default function Until({ until, children }: { until: string; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(Date.now() < Date.parse(`${until}T23:59:59+05:30`)); }, [until]);
  return on ? <>{children}</> : null;
}
