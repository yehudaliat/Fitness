"use client";

import mixpanel from "mixpanel-browser";
import { getRef } from "./ref";

// הטוקן מגיע רק ממשתנה סביבה. בלעדיו לא נשלח כלום.
const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let ready = false;

/** מאתחל את Mixpanel פעם אחת, בצד הלקוח בלבד, ומזהה את המשתתף לפי r. */
export function initAnalytics() {
  if (ready || typeof window === "undefined" || !TOKEN) return;

  mixpanel.init(TOKEN, {
    track_pageview: true,
    persistence: "localStorage",
    record_sessions_percent: 100,
    record_mask_text_selector: "input, textarea, select",
    record_block_selector: "video",
  });

  const r = getRef(); // קורא מה-URL ושומר ב-localStorage
  if (r !== "none") {
    mixpanel.identify("r-" + r);
    mixpanel.register({ r });
  }
  ready = true;
}

/**
 * האירועים היחידים שנשלחים. המאפיינים מוגדרים לכל אירוע בנפרד,
 * כך שאי אפשר לשלוח בטעות שם, פרטי קשר או את טקסט הכאב.
 */
type Events = {
  "Example Opened": Record<string, never>;
  "CTA Clicked": Record<string, never>;
  "Form Started": Record<string, never>;
  "Video Selected": { file_size_mb: number; file_type: string };
  "Upload Started": { exercise: string };
  "Upload Failed": { error: string; file_size_mb: number };
  "Form Submitted": { exercise: string; has_pain_text: boolean };
};

export function track<E extends keyof Events>(event: E, props?: Events[E]) {
  if (!ready) return;
  try {
    mixpanel.track(event, props ?? {});
  } catch {}
}

export const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;
