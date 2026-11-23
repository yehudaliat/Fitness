"use client";

import { track as vercelTrack } from "@vercel/analytics";
import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
// לפרויקט Mixpanel באירופה: https://api-eu.mixpanel.com
const API_HOST = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST;

let ready = false;

/** מאתחל את Mixpanel פעם אחת ומשייך את כל האירועים למשתתף r. */
export function initAnalytics(r: string) {
  if (ready || !TOKEN) return;
  mixpanel.init(TOKEN, {
    track_pageview: false, // שולחים page_view בעצמנו, עם r
    persistence: "localStorage",
    ...(API_HOST ? { api_host: API_HOST } : {}),
  });
  if (r !== "none") mixpanel.identify(`r${r}`);
  mixpanel.register({ r });
  ready = true;
}

/** שולח את האירוע גם ל-Vercel Analytics וגם ל-Mixpanel. */
export function trackEvent(name: string, props: Record<string, string>) {
  try {
    vercelTrack(name, props);
  } catch {}
  if (ready) {
    try {
      mixpanel.track(name, props);
    } catch {}
  }
}
