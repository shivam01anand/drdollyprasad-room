"use client";

import { useEffect, useState } from "react";
import { MOTION_EVENT, motionPaused, setMotionPaused, storedMotionPaused } from "@/lib/motion-rules";

/** the footer's one stop for everything that moves by itself; looks like the other footer links */
export default function MotionToggle() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (storedMotionPaused() && !motionPaused()) setMotionPaused(true);
    const sync = () => setPaused(motionPaused());
    sync();
    window.addEventListener(MOTION_EVENT, sync);
    return () => window.removeEventListener(MOTION_EVENT, sync);
  }, []);
  return (
    <button type="button" className="ftr-motion" aria-pressed={paused} onClick={() => setMotionPaused(!paused)}>
      {paused ? "Resume movement" : "Pause movement"}
    </button>
  );
}
