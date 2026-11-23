# דף נחיתה – בדיקת טכניקה ממאמן (MVP)

## הגדרה
1. Vercel → Storage → Create → Blob, ובחירה ב-**Private**. חברו את ה-store לפרויקט (נוצר `BLOB_READ_WRITE_TOKEN`).
2. Environment Variables (Production + Preview):
   - `ADMIN_PASSWORD`: סיסמה לדף `/admin` (שם המשתמש לא משנה).
   - `NEXT_PUBLIC_MIXPANEL_TOKEN`: ה-Project Token מ-Mixpanel. נכנס לקוד בזמן ה-build, ולכן אחרי שינוי צריך Redeploy.
3. סרטון הדוגמה: `public/example.mp4`. תמונת פתיחה (לא חובה): `public/example-poster.jpg`. בלי סרטון מוצגת מסגרת ריקה במקום נגן שבור.
4. טקסט המשוב לדוגמה: `app/components/Landing.tsx`, שלושת ה-placeholders המסומנים ב-TODO.

## מדידה (Mixpanel)
- זיהוי: `?r=1`…`?r=10` → `identify("r-N")` + `register({ r })`. ה-r נשמר ב-localStorage.
- Session Replay על 100% מהביקורים. כל השדות ממוסכים, הסרטונים חסומים, ושם הקובץ שנבחר לא מוקלט.
- אירועים: `Example Opened`, `CTA Clicked`, `Form Started` (פעם אחת בביקור), `Video Selected`, `Upload Started`, `Upload Failed`, `Form Submitted`, וגם צפיית דף אוטומטית.
- לא נשלחים שם, פרטי קשר או טקסט הכאב. הם נשמרים רק ב-Blob הפרטי ומוצגים ב-`/admin`.

## פיתוח מקומי
```
npm install
vercel env pull .env.local
npm run dev
```
