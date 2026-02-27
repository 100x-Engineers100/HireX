import { NextRequest, NextResponse } from "next/server";
import { fetchResume } from "@/lib/pdf-fetcher";
import { extractText } from "@/lib/pdf-parser";

// Serverless (Node runtime) - needed for pdf-parse + mammoth
export async function POST(req: NextRequest) {
  try {
    const { resume_url } = await req.json();
    if (!resume_url) return NextResponse.json({ text: "" });

    const fetched = await fetchResume(resume_url);
    if (!fetched) return NextResponse.json({ text: "" });

    const text = await extractText(fetched.buffer, fetched.mimeType);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[/api/fetch-resume] Error:", message);
    return NextResponse.json({ text: "" });
  }
}
