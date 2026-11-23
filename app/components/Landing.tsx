"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { getRef } from "@/lib/ref";
import { initAnalytics, toMb, track } from "@/lib/analytics";
import { EXERCISES, MAX_VIDEO_BYTES } from "@/lib/exercises";

const FORM_STARTED_KEY = "mp_form_started";

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

type Props = { hasExample: boolean; poster?: string };

export default function Landing({ hasExample, poster }: Props) {
  const exampleTracked = useRef(false);
  const formStarted = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [exercise, setExercise] = useState("");
  const [pain, setPain] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    initAnalytics();
    try {
      formStarted.current = sessionStorage.getItem(FORM_STARTED_KEY) === "1";
    } catch {}
  }, []);

  // פעם אחת בכל ביקור (נשמר ב-sessionStorage, כך שגם רענון לא שולח שוב)
  const onFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    try {
      sessionStorage.setItem(FORM_STARTED_KEY, "1");
    } catch {}
    track("Form Started");
  };

  const onExampleOpened = () => {
    if (exampleTracked.current) return;
    exampleTracked.current = true;
    track("Example Opened");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setFileError("");
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    track("Video Selected", { file_size_mb: toMb(f.size), file_type: f.type || ext || "unknown" });

    if (!videoContentType(f)) {
      setFile(null);
      setFileError("אפשר להעלות רק סרטון בפורמט MP4 או MOV.");
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setFile(null);
      setFileError("הסרטון גדול מ-100MB. נסו לצלם סט אחד בלבד, או לקצר את הסרטון.");
      return;
    }
    setFile(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) return setError("צריך לבחור סרטון של סט אחד.");
    if (!exercise) return setError("בחרו תרגיל.");
    if (!pain.trim()) return setError("כתבו בקצרה מה כואב ומתי.");
    if (!name.trim()) return setError("כתבו את השם שלכם.");
    if (!isContactValid(contact)) return setError("השאירו מספר ווטסאפ או כתובת מייל תקינה.");
    if (!consent) return setError("צריך לסמן את התיבה לפני השליחה.");

    const contentType = videoContentType(file)!;
    const r = getRef();
    setSending(true);

    // 1. העלאת הסרטון ישירות ל-Blob
    let videoPathname: string;
    track("Upload Started", { exercise });
    setProgress(0);
    try {
      const ext = contentType === "video/mp4" ? "mp4" : "mov";
      const blob = await upload(`videos/r${r}/${Date.now()}.${ext}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        contentType,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      videoPathname = blob.pathname;
    } catch (err) {
      console.error(err);
      track("Upload Failed", {
        error: String((err as Error)?.message ?? err).slice(0, 200),
        file_size_mb: toMb(file.size),
      });
      setProgress(null);
      setSending(false);
      setError("העלאת הסרטון נכשלה. בדקו את החיבור ונסו שוב.");
      return;
    }

    // 2. שמירת ההגשה
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPathname, exercise, pain, name, contact, consent, r }),
      });
      if (!res.ok) throw new Error(await res.text());
      track("Form Submitted", { exercise, has_pain_text: pain.trim().length > 0 });
      setSent(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      setError("משהו השתבש בשליחה. נסו שוב בעוד רגע.");
    } finally {
      setSending(false);
      setProgress(null);
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
          <a href="#send" className="btn" onClick={() => track("CTA Clicked")}>לשליחת סרטון</a>
        </section>

        {/* 2. דוגמה אמיתית */}
        <section>
          <h2>כך נראה משוב</h2>
          {hasExample ? (
            <video
              className="example"
              src={poster ? "/example.mp4" : "/example.mp4#t=0.1"}
              poster={poster}
              controls
              playsInline
              preload="metadata"
              onPlay={onExampleOpened}
              onClick={onExampleOpened}
            />
          ) : (
            <div className="example-missing">סרטון הדוגמה יופיע כאן</div>
          )}
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
          <form onSubmit={onSubmit} onFocusCapture={onFormFocus} noValidate>
            <div className="field">
              <span className="label">סרטון של סט אחד</span>
              <div className="file-box">
                <input
                  id="video"
                  className="sr-only rr-ignore"
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  onChange={onFile}
                  disabled={sending}
                />
                <label htmlFor="video" className="file-btn">
                  {file ? "החלפת סרטון" : "בחירת סרטון"}
                </label>
                {/* mp-block / rr-ignore: שם הקובץ לא נכנס להקלטת המסך */}
                {file && <p className="file-name mp-block">{file.name} · {toMb(file.size)}MB</p>}
                {fileError && <p className="error" role="alert">{fileError}</p>}
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

            {progress !== null && (
              <div>
                <div className="progress" aria-hidden><span style={{ width: `${progress}%` }} /></div>
                <p className="progress-text" aria-live="polite">
                  {progress < 100 ? `מעלה את הסרטון… ${progress}%` : "שומר…"}
                </p>
              </div>
            )}

            <button type="submit" className="btn" disabled={sending} style={{ marginTop: 0 }}>
              {sending ? "שולח…" : "שליחה לבדיקה"}
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
