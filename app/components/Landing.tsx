"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { upload } from "@vercel/blob/client";
import { getRef } from "@/lib/ref";
import { EXERCISES, MAX_VIDEO_BYTES } from "@/lib/exercises";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; pct: number }
  | { status: "done"; pathname: string }
  | { status: "error"; message: string };

function videoContentType(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (file.type === "video/mp4" || ext === "mp4") return "video/mp4";
  if (file.type === "video/quicktime" || ext === "mov") return "video/quicktime";
  return null;
}

function isContactValid(v: string) {
  const s = v.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true;
  return s.replace(/\D/g, "").length >= 9;
}

export default function Landing() {
  const ref = useRef("none");
  const formStarted = useRef(false);
  const exampleTracked = useRef(false);
  const uploadPromise = useRef<Promise<string> | null>(null);
  const uploadId = useRef(0);

  const [upl, setUpl] = useState<UploadState>({ status: "idle" });
  const [fileName, setFileName] = useState("");
  const [exercise, setExercise] = useState("");
  const [pain, setPain] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    ref.current = getRef();
    track("page_view", { r: ref.current });
  }, []);

  const onFormTouch = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    track("form_start", { r: ref.current });
  };

  const onExamplePlay = () => {
    if (exampleTracked.current) return;
    exampleTracked.current = true;
    track("video_example_play", { r: ref.current });
  };

  // ההעלאה מתחילה מיד כשבוחרים סרטון, כדי שהשליחה תהיה מהירה.
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const contentType = videoContentType(file);
    if (!contentType) {
      uploadId.current++;
      setUpl({ status: "error", message: "אפשר להעלות רק סרטון בפורמט MP4 או MOV." });
      uploadPromise.current = null;
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      uploadId.current++;
      setUpl({ status: "error", message: "הסרטון גדול מ-100MB. נסו לצלם סט אחד בלבד, או לקצר את הסרטון." });
      uploadPromise.current = null;
      return;
    }

    const r = ref.current;
    const id = ++uploadId.current;
    const isCurrent = () => id === uploadId.current;
    track("upload_start", { r });
    setUpl({ status: "uploading", pct: 0 });

    const ext = contentType === "video/mp4" ? "mp4" : "mov";
    const p = upload(`videos/r${r}/${Date.now()}.${ext}`, file, {
      access: "private",
      handleUploadUrl: "/api/upload",
      contentType,
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => {
        if (isCurrent()) setUpl({ status: "uploading", pct: Math.round(percentage) });
      },
    }).then(
      (blob) => {
        if (isCurrent()) setUpl({ status: "done", pathname: blob.pathname });
        return blob.pathname;
      },
      (err) => {
        console.error(err);
        if (isCurrent()) setUpl({ status: "error", message: "ההעלאה נכשלה. בדקו את החיבור ונסו לבחור את הסרטון שוב." });
        throw err;
      },
    );
    p.catch(() => {});
    uploadPromise.current = p;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!uploadPromise.current || upl.status === "error") return setError("צריך לבחור סרטון של סט אחד.");
    if (!exercise) return setError("בחרו תרגיל.");
    if (!pain.trim()) return setError("כתבו בקצרה מה כואב ומתי.");
    if (!name.trim()) return setError("כתבו את השם שלכם.");
    if (!isContactValid(contact)) return setError("השאירו מספר ווטסאפ או כתובת מייל תקינה.");
    if (!consent) return setError("צריך לסמן את התיבה לפני השליחה.");

    setSending(true);
    try {
      const videoPathname = await uploadPromise.current;
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPathname, exercise, pain, name, contact, consent, r: ref.current,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      track("submit_success", { r: ref.current, exercise });
      setSent(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      setError("משהו השתבש בשליחה. נסו שוב בעוד רגע.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <>
        <main className="wrap done">
          <div className="mark" aria-hidden>✓</div>
          <h1>קיבלנו.</h1>
          <p className="lead">משוב ממאמן יגיע תוך 24 שעות לווטסאפ או למייל שהשארת.</p>
        </main>
        <Footer />
      </>
    );
  }

  const waitingForUpload = sending && upl.status === "uploading";

  return (
    <>
      <main className="wrap">
        {/* 1. אזור עליון */}
        <section>
          <h1>לא רואים את עצמך מהצד? מאמן יבדוק את הטכניקה שלך, בהתאם לפציעה שלך</h1>
          <ol className="steps">
            <li><span className="num">1</span><span className="step-text">מצלמים סט אחד</span></li>
            <li><span className="num">2</span><span className="step-text">כותבים מה כואב</span></li>
            <li><span className="num">3</span><span className="step-text">מקבלים משוב תוך 24 שעות</span></li>
          </ol>
          <p className="free">הבדיקה הראשונה חינם</p>
          <a href="#send" className="btn">לשליחת סרטון</a>
        </section>

        {/* 2. דוגמה אמיתית */}
        <section>
          <h2>כך נראה משוב</h2>
          <video
            className="example"
            src="/example.mp4"
            controls
            playsInline
            preload="metadata"
            onPlay={onExamplePlay}
          />
          <div className="feedback">
            <div>
              <h3>מה ראיתי</h3>
              {/* TODO: להחליף בטקסט המשוב האמיתי */}
              <p className="placeholder">[טקסט: מה המאמן ראה בסרטון]</p>
            </div>
            <div>
              <h3>למה זה חשוב לפציעה שלך</h3>
              {/* TODO: להחליף בטקסט המשוב האמיתי */}
              <p className="placeholder">[טקסט: הקשר בין מה שנראה לבין הכאב שתואר]</p>
            </div>
            <div>
              <h3>מה לשנות בסט הבא</h3>
              {/* TODO: להחליף בטקסט המשוב האמיתי */}
              <p className="placeholder">[טקסט: שינוי אחד או שניים, ברורים ומעשיים]</p>
            </div>
          </div>
        </section>

        {/* 3. טופס */}
        <section id="send">
          <h2>שליחת סרטון לבדיקה</h2>
          <form
            onSubmit={onSubmit}
            onFocusCapture={onFormTouch}
            onPointerDownCapture={onFormTouch}
            noValidate
          >
            <div className="field">
              <span className="label">סרטון של סט אחד</span>
              <div className="file-box">
                <input
                  id="video"
                  className="sr-only"
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  onChange={onFile}
                />
                <label htmlFor="video" className="file-btn">
                  {fileName ? "החלפת סרטון" : "בחירת סרטון"}
                </label>
                {fileName && <p className="file-name">{fileName}</p>}
                {upl.status === "uploading" && (
                  <>
                    <div className="progress" aria-hidden><span style={{ width: `${upl.pct}%` }} /></div>
                    <p className="progress-text" aria-live="polite">מעלה… {upl.pct}%</p>
                  </>
                )}
                {upl.status === "done" && <p className="progress-text">הסרטון הועלה ✓</p>}
                {upl.status === "error" && <p className="error" role="alert">{upl.message}</p>}
              </div>
              <p className="hint">מצלמת הטלפון, MP4 או MOV, עד 100MB. צלמו מהצד, שכל הגוף ייכנס לפריים.</p>
            </div>

            <div className="field">
              <label htmlFor="exercise">תרגיל</label>
              <select id="exercise" value={exercise} onChange={(e) => setExercise(e.target.value)}>
                <option value="" disabled>בחירה</option>
                {EXERCISES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="pain">מה כואב ומתי</label>
              <textarea
                id="pain"
                rows={2}
                maxLength={200}
                placeholder="למשל: כאב בגב התחתון בירידה של הסקוואט, בעיקר בסטים כבדים"
                value={pain}
                onChange={(e) => setPain(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="name">שם</label>
              <input id="name" type="text" autoComplete="given-name" maxLength={80}
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="contact">ווטסאפ או מייל</label>
              <input id="contact" type="text" inputMode="email" autoComplete="email" dir="ltr"
                style={{ textAlign: "right" }} maxLength={120}
                value={contact} onChange={(e) => setContact(e.target.value)} />
              <p className="hint">לכאן יישלח המשוב.</p>
            </div>

            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>הבנתי שזה משוב מקצועי ולא אבחון רפואי</span>
            </label>

            {error && <p className="error" role="alert">{error}</p>}

            <button type="submit" className="btn" disabled={sending} style={{ marginTop: 0 }}>
              {waitingForUpload ? "מסיים להעלות את הסרטון…" : sending ? "שולח…" : "שליחה לבדיקה"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        המשוב אינו תחליף לאבחון רפואי. כאב חד או החמרה – פנה/י לפיזיותרפיסט או לרופא.
      </div>
    </footer>
  );
}
