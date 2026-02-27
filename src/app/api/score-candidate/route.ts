import { NextRequest, NextResponse } from "next/server";
import { parseJD, scoreCandidate } from "@/lib/llm";
import { fetchResume } from "@/lib/pdf-fetcher";
import { extractText } from "@/lib/pdf-parser";
import { CandidateRow } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidate: CandidateRow = body.candidate;
    // page.tsx sends jd_text (not pre-parsed criteria) + resume_url
    const jdText: string = body.jd_text || "";

    if (!candidate || !jdText) {
      return NextResponse.json({ error: "candidate and jd_text required" }, { status: 400 });
    }

    // Parse criteria from jd_text
    const criteria = await parseJD(jdText);

    // Fetch and parse resume
    let resumeText = "";
    const resumeUrl = body.resume_url || candidate.resume_url || "";
    if (resumeUrl) {
      const fetched = await fetchResume(resumeUrl);
      if (fetched) {
        resumeText = await extractText(fetched.buffer, fetched.mimeType);
      }
    }

    // Score and return result directly (page.tsx spreads this as c.score)
    const scoreResult = await scoreCandidate(candidate, criteria, resumeText);
    return NextResponse.json(scoreResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/score-candidate] Error:", message);
    return NextResponse.json(
      { overall_score: 0, recommendation: "Error", top_strengths: [], key_gaps: [], red_flags: [message], justification: "" },
      { status: 500 }
    );
  }
}
