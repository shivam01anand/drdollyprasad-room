"use client";

import { useEffect } from "react";

/** links shared before the studio moved (drdollyprasad.com/#work=<id>, /#works) still arrive */
export default function HashRedirect() {
  useEffect(() => {
    const m = /^#work=([a-z0-9-]+)$/.exec(location.hash);
    if (m) location.replace(`/work/${m[1]}`);
    else if (location.hash === "#works") location.replace("/works");
  }, []);
  return null;
}
