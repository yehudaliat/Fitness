import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_VIDEO_BYTES, VIDEO_TYPES } from "@/lib/exercises";

// מנפיק טוקן קצר-מועד להעלאה ישירה מהדפדפן ל-Blob (עוקף את מגבלת 4.5MB של פונקציות).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^videos\/r(none|[1-9]|10)\/[\w.-]+\.(mp4|mov)$/i.test(pathname)) {
          throw new Error("invalid pathname");
        }
        return {
          allowedContentTypes: VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
      onUploadCompleted: async () => {
        // לא נדרש: ההגשה נשמרת ב-/api/submit אחרי שהטופס נשלח.
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
