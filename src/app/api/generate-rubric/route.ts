import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { JDCriteria, ScoringRubric } from "@/types";
import { buildRubricGenPrompt } from "@/lib/prompts";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set in environment");
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const criteria: JDCriteria = body.criteria;
    const rawJDText: string = body.rawJDText || "";

    if (!criteria || !criteria.role_title) {
      return NextResponse.json(
        { error: "criteria field required with valid role_title" },
        { status: 400 }
      );
    }
    if (!rawJDText || rawJDText.trim().length < 20) {
      return NextResponse.json(
        { error: "rawJDText required (min 20 chars)" },
        { status: 400 }
      );
    }

    const client = getClient();
    const prompt = buildRubricGenPrompt(criteria, rawJDText);

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";
    let rubric: ScoringRubric;

    try {
      rubric = JSON.parse(raw) as ScoringRubric;
    } catch {
      return NextResponse.json(
        { error: `LLM returned invalid JSON: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    // Validate dimensions array
    if (!Array.isArray(rubric.dimensions)) {
      return NextResponse.json(
        { error: "rubric.dimensions must be an array" },
        { status: 400 }
      );
    }
    if (rubric.dimensions.length < 3 || rubric.dimensions.length > 5) {
      return NextResponse.json(
        { error: `Expected 3-5 dimensions, got ${rubric.dimensions.length}` },
        { status: 400 }
      );
    }

    // Validate weights sum to ~1.0
    const weightSum = rubric.dimensions.reduce((sum, d) => sum + (d.weight || 0), 0);
    if (weightSum < 0.99 || weightSum > 1.01) {
      return NextResponse.json(
        { error: `Dimension weights sum to ${weightSum.toFixed(3)}, must be 1.0` },
        { status: 400 }
      );
    }

    return NextResponse.json({ rubric });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate-rubric] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
