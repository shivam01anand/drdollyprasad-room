import type { PostHog } from "posthog-js";
import type { Work } from "./works";

type Properties = Record<string, string | number | boolean | null | undefined>;
type Pending = { event: string; properties: Properties; timestamp: Date };

let client: Pick<PostHog, "capture"> | undefined;
let starting: Promise<void> | undefined;
let recordingClient: Pick<PostHog, 'startSessionRecording' | 'stopSessionRecording' | 'has_opted_out_capturing'> | undefined;
const privatePage = () => typeof location !== "undefined" && (location.pathname === "/analytics" || location.pathname.startsWith("/analytics/"));
export function suspendAnalytics() {
  pending.length = 0;
  recordingClient?.stopSessionRecording();
}
const pending: Pending[] = [];
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const SAFE_QUERY = new Set(["work", "series", "status", "size", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);

/** Keep attribution and catalogue filters, without copying arbitrary query strings. */
export function analyticsUrl(value: string, base = "https://drdollyprasad.com") {
  if (!value || value === "$direct") return value;
  try {
    const url = new URL(value, base);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    for (const key of [...url.searchParams.keys()]) if (!SAFE_QUERY.has(key)) url.searchParams.delete(key);
    url.hash = "";
    return url.toString();
  } catch { return ""; }
}

export function paintingProperties(w: Work) {
  return { painting_id: w.id, painting_title: w.title, collection: w.series, availability: w.status };
}

export function analyticsEnvironment(host: string) {
  if (host === "drdollyprasad.com" || host === "www.drdollyprasad.com") return "production";
  return host === "localhost" || host === "127.0.0.1" ? "local" : "preview";
}

function isTestSession() {
  try {
    const flag = new URLSearchParams(location.search).get("analytics_test");
    if (flag === "1") sessionStorage.setItem("dolly-analytics-test", "1");
    if (flag === "0") sessionStorage.removeItem("dolly-analytics-test");
    return sessionStorage.getItem("dolly-analytics-test") === "1";
  } catch { return new URLSearchParams(location.search).get("analytics_test") === "1"; }
}

/** Small synchronous entry point: the larger SDK loads separately after hydration. */
export function track(event: string, properties: Properties = {}) {
  if (typeof window === "undefined" || !KEY || privatePage()) return;
  const item: Pending = {
    event,
    timestamp: new Date(),
    properties: {
      app_name: "drdollyprasad",
      analytics_environment: analyticsEnvironment(location.hostname),
      is_test: isTestSession(),
      $current_url: analyticsUrl(location.href),
      $pathname: location.pathname,
      $host: location.host,
      ...properties,
    },
  };
  if (client) {
    try { client.capture(item.event, item.properties, { timestamp: item.timestamp }); } catch { /* keep the visitor's action working */ }
  }
  else if (pending.length < 200) pending.push(item);
}

export function initAnalytics() {
  if (typeof window === "undefined" || !KEY || privatePage()) return Promise.resolve();
  if (starting) {
    if (recordingClient && !recordingClient.has_opted_out_capturing()) recordingClient.startSessionRecording({ url_trigger: true });
    return starting;
  }
  starting = import("posthog-js").then(({ default: posthog }) => {
    if (privatePage()) { starting = undefined; return; }
    posthog.init(KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com",
      defaults: "2026-05-30",
      // One pageview per Next route; filtering the catalogue is not another visit.
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      capture_dead_clicks: false,
      rageclick: false,
      capture_exceptions: false,
      enable_recording_console_log: false,
      capture_heatmaps: false,
      capture_performance: { web_vitals: true, network_timing: false },
      disable_surveys: true,
      person_profiles: "always",
      respect_dnt: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: ".ph-mask",
        blockSelector: ".stage, .wall-labels",
        recordCrossOriginIframes: false,
        captureCanvas: { recordCanvas: false },
        recordHeaders: false,
        recordBody: false,
        streamNetworkBody: false,
      },
      before_send: (event) => {
        if (privatePage()) return null;
        const clean = (props: Record<string, unknown> | undefined) => {
          if (!props) return;
          for (const key of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer", "$session_entry_url", "$session_entry_referrer"]) {
            if (typeof props[key] === "string") props[key] = analyticsUrl(props[key]);
          }
        };
        clean(event.properties);
        clean(event.properties.$set);
        clean(event.properties.$set_once);
        return event;
      },
      loaded: (sdk) => {
        recordingClient = sdk;
        sdk.register({
          app_name: "drdollyprasad",
          analytics_environment: analyticsEnvironment(location.hostname),
          is_test: isTestSession(),
        });
        client = sdk;
        // The shared project's URL trigger is Book2Kindle-only. Apply an override
        // to this client/session, including sessions that rotate in a long-lived tab.
        let recordingSession: string | undefined;
        sdk.onSessionId((sessionId) => {
          if (sessionId === recordingSession) return;
          recordingSession = sessionId;
          if (!privatePage() && !sdk.has_opted_out_capturing()) sdk.startSessionRecording({ url_trigger: true });
        });
        for (const item of pending.splice(0)) sdk.capture(item.event, item.properties, { timestamp: item.timestamp });
      },
    });
  }).catch(() => {
    // Analytics must never stop the gallery or enquiry controls from working.
    pending.length = 0;
    starting = undefined;
  });
  return starting;
}
