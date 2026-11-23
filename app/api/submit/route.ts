import { head, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { EXERCISES } from "@/lib/exercises";
import { isValidRef } from "@/lib/ref";
import type { Submission } from "@/lib/types";

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const videoPathname = clean(data.videoPathname, 300);
  const exercise = clean(data.exercise, 40);
  const pain = clean(data.pain, 300);
  const name = clean(data.name, 80);
  const contact = clean(data.contact, 120);
  const r = isValidRef(data.r) ? data.r : "none";

  if (
    !videoPathname.startsWith("videos/") ||
    !(EXERCISES as readonly string[]).includes(exercise) ||
    !pain || !name || !contact ||
    data.consent !== true
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // מוודא שהסרטון באמת הועלה
  let videoSize: number | null = null;
  try {
    const meta = await head(videoPathname);
    videoSize = meta.size;
  } catch {
    return NextResponse.json({ error: "video not found" }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const id = `${createdAt.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
  const submission: Submission = {
    id, createdAt, r, videoPathname, videoSize, exercise, pain, name, contact,
  };

  await put(`submissions/${id}.json`, JSON.stringify(submission), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  return NextResponse.json({ ok: true });
}
