"use client";

import { useId, useState } from "react";

/** a few labelled panels, one shown at a time (arrow keys move between the tabs) */
export default function Tabs({ tabs }: { tabs: { label: string; body: React.ReactNode }[] }) {
  const [at, setAt] = useState(0);
  const id = useId();
  const key = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (at + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setAt(n);
    document.getElementById(`${id}-t${n}`)?.focus();
  };
  return (
    <div className="tabs">
      <div className="tablist" role="tablist" onKeyDown={key}>
        {tabs.map((t, i) => (
          <button key={t.label} id={`${id}-t${i}`} type="button" role="tab" aria-selected={at === i}
                  aria-controls={`${id}-p${i}`} tabIndex={at === i ? 0 : -1} onClick={() => setAt(i)}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} id={`${id}-p${i}`} role="tabpanel" aria-labelledby={`${id}-t${i}`} className="tabpanel" hidden={at !== i}>
          {t.body}
        </div>
      ))}
    </div>
  );
}
