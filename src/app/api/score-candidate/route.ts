import { NextRequest, NextResponse } from "next/server";
import { scoreCandidate } from "@/lib/llm";
import { CandidateRow, JDCriteria, ScoringRubric } from "@/types";

// Edge runtime: 30s limit on Vercel free tier (vs 10s for serverless)
// PDF fetch+parse is handled separately by /api/fetch-resume (Node runtime)
export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidate: CandidateRow = body.candidate;
    const criteria: JDCriteria = body.criteria;
    const rubric: ScoringRubric = body.rubric;
    const resumeText: string = body.resume_text || "";

    if (!candidate || !criteria) {
      return NextResponse.json({ error: "candidate and criteria required" }, { status: 400 });
    }
    if (!rubric || !rubric.dimensions || rubric.dimensions.length === 0) {
      return NextResponse.json({ error: "rubric with dimensions required" }, { status: 400 });
    }

    const scoreResult = await scoreCandidate(candidate, criteria, resumeText, rubric);
    return NextResponse.json(scoreResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/score-candidate] Error:", message);
    return NextResponse.json(
      { overall_score: 0, recommendation: "Error", top_strengths: [], key_gaps: [], red_flags: [message], justification: "", dimension_scores: [] },
      { status: 500 }
    );
  }
}
