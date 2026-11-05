import { NextResponse } from "next/server";
import { detectKind, extractText, MAX_UPLOAD_BYTES } from "@/lib/resume/extract-text";
import { parseResumeText } from "@/lib/resume/parse-text";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Reads an uploaded resume in memory and returns a structured draft.
// The file itself is never stored.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Files must be 5 MB or smaller." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes);
  if (!kind || (kind === "docx" && !file.name.toLowerCase().endsWith(".docx"))) {
    return NextResponse.json({ error: "Please upload a PDF or Word (.docx) file." }, { status: 415 });
  }

  let text: string;
  try {
    text = await extractText(bytes, kind);
  } catch {
    return NextResponse.json({ error: "We couldn't read this file. It may be damaged or password-protected." }, { status: 422 });
  }
  if (text.trim().length < 30) {
    return NextResponse.json(
      { error: "We couldn't find text in this file. If it's a scanned image, try a Word version, or build your resume with guided questions." },
      { status: 422 },
    );
  }

  return NextResponse.json(parseResumeText(text));
}
