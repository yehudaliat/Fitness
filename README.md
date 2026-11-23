# דף נחיתה – בדיקת טכניקה ממאמן (MVP)

## הגדרה
1. Vercel → Storage → Create → Blob, ובחירה ב-**Private**. חברו את ה-store לפרויקט (נוצר `BLOB_READ_WRITE_TOKEN`).
2. Environment Variables: `ADMIN_PASSWORD` (לדף `/admin`, שם המשתמש לא משנה).
3. Analytics → Enable. אירועים מותאמים אישית (custom events) דורשים תוכנית Pro.
4. לשים את סרטון הדוגמה ב-`public/example.mp4`.
5. טקסט המשוב לדוגמה: `app/components/Landing.tsx`, שלושת ה-placeholders המסומנים ב-TODO.

## אירועים
`page_view`, `video_example_play`, `form_start`, `upload_start`, `submit_success`. לכולם יש מאפיין `r` (1–10, או `none`).
ההעלאה מתחילה כשבוחרים סרטון, ולכן `upload_start` = "בחר/ה סרטון".

## פיתוח מקומי
```
npm install
vercel env pull .env.local
npm run dev
```
