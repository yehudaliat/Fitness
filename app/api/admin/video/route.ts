import { get, issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// מוגן ע"י middleware. מחזיר הפניה לקישור חתום שתקף 15 דקות בלבד, כך שאין כתובת קבועה לסרטון.
export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("p") ?? "";
  if (!pathname.startsWith("videos/")) {
    return new NextResponse("not found", { status: 404 });
  }

  try {
    const validUntil = Date.now() + 15 * 60 * 1000;
    const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname,
      validUntil,
      access: "private",
    });
    return NextResponse.redirect(presignedUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // גיבוי: הזרמת הקובץ דרך השרת
    const res = await get(pathname, { access: "private" });
    if (!res || res.statusCode !== 200) {
      return new NextResponse("not found", { status: 404 });
    }
    return new NextResponse(res.stream, {
      headers: {
        "Content-Type": res.blob.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  }
}
