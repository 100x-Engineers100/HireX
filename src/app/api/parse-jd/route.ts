import { NextRequest, NextResponse } from "next/server";
import { parseJD } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // page.tsx sends { jd_text }
    const jdText: string = body.jd_text || body.jdText || "";

    if (!jdText || jdText.trim().length < 20) {
      return NextResponse.json({ error: "jd_text required (min 20 chars)" }, { status: 400 });
    }

    // Return criteria directly (not wrapped) so page.tsx can spread it
    const criteria = await parseJD(jdText);
    return NextResponse.json(criteria);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/parse-jd] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
