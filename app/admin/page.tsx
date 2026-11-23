import { get, list } from "@vercel/blob";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "הגשות", robots: { index: false, follow: false } };

async function listAll(prefix: string) {
  const blobs: { pathname: string; uploadedAt: Date; size: number }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readSubmission(pathname: string): Promise<Submission | null> {
  try {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text());
  } catch {
    return null;
  }
}

const fmt = (d: string | Date) =>
  new Date(d).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });

const mb = (b: number | null) => (b ? `${(b / 1024 / 1024).toFixed(1)}MB` : "");

const videoLink = (p: string) => `/api/admin/video?p=${encodeURIComponent(p)}`;

export default async function AdminPage() {
  const [subBlobs, videoBlobs] = await Promise.all([listAll("submissions/"), listAll("videos/")]);
  const subs = (await Promise.all(subBlobs.map((b) => readSubmission(b.pathname))))
    .filter((s): s is Submission => !!s)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // סרטונים שהועלו אבל הטופס לא נשלח
  const used = new Set(subs.map((s) => s.videoPathname));
  const orphans = videoBlobs
    .filter((v) => !used.has(v.pathname))
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));

  return (
    <main className="admin">
      <h1>הגשות ({subs.length})</h1>
      <p className="lead" style={{ marginBottom: 24 }}>
        קישורי הסרטונים פותחים כתובת חתומה שתקפה ל-15 דקות בלבד. אל תעבירו אותם הלאה.
      </p>

      {subs.length === 0 ? (
        <p>עדיין אין הגשות.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>מועד</th><th>r</th><th>שם</th><th>קשר</th><th>תרגיל</th><th>מה כואב ומתי</th><th>סרטון</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td data-label="מועד">{fmt(s.createdAt)}</td>
                <td data-label="r">{s.r}</td>
                <td data-label="שם">{s.name}</td>
                <td data-label="קשר" dir="ltr" style={{ textAlign: "right" }}>{s.contact}</td>
                <td data-label="תרגיל">{s.exercise}</td>
                <td data-label="מה כואב" className="pain">{s.pain}</td>
                <td data-label="סרטון">
                  <a href={videoLink(s.videoPathname)} target="_blank" rel="noreferrer">צפייה</a>{" "}
                  <span className="hint">{mb(s.videoSize)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {orphans.length > 0 && (
        <>
          <h2 style={{ marginTop: 48 }}>סרטונים שהועלו בלי שליחת טופס ({orphans.length})</h2>
          <table>
            <thead><tr><th>מועד</th><th>r</th><th>סרטון</th></tr></thead>
            <tbody>
              {orphans.map((v) => (
                <tr key={v.pathname}>
                  <td data-label="מועד">{fmt(v.uploadedAt)}</td>
                  <td data-label="r">{v.pathname.split("/")[1]?.replace(/^r/, "")}</td>
                  <td data-label="סרטון">
                    <a href={videoLink(v.pathname)} target="_blank" rel="noreferrer">צפייה</a>{" "}
                    <span className="hint">{mb(v.size)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
