// מזהה המשתתף מהקישור: ?r=1 עד ?r=10
const KEY = "mvp_r";

export function isValidRef(v: unknown): v is string {
  return typeof v === "string" && /^([1-9]|10)$/.test(v);
}

/** קורא את r מה-URL, שומר אותו בדפדפן כדי שיישאר גם אם הפרמטר נעלם, ומחזיר "none" אם אין. */
export function getRef(): string {
  if (typeof window === "undefined") return "none";
  const fromUrl = new URLSearchParams(window.location.search).get("r");
  if (isValidRef(fromUrl)) {
    try {
      localStorage.setItem(KEY, fromUrl);
    } catch {}
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (isValidRef(saved)) return saved;
  } catch {}
  return "none";
}
