import OpenAI from "openai";
import { JDCriteria, ScoreResult } from "@/types";
import { buildJDParsePrompt, buildScoringPrompt, formatCandidateProfile } from "@/lib/prompts";
import { CandidateRow } from "@/types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set in environment");
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

// Parses a raw JD string into structured JDCriteria via LLM
export async function parseJD(jdText: string): Promise<JDCriteria> {
  const client = getClient();
  const prompt = buildJDParsePrompt(jdText);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(raw) as JDCriteria;
  } catch {
    throw new Error(`LLM returned invalid JSON for JD parse: ${raw}`);
  }
}

// Scores a single candidate against the JD criteria
export async function scoreCandidate(
  candidate: CandidateRow,
  criteria: JDCriteria,
  resumeText: string
): Promise<ScoreResult> {
  const client = getClient();
  const profile = formatCandidateProfile(candidate);
  const prompt = buildScoringPrompt(criteria, profile, resumeText);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(raw) as ScoreResult;
  } catch {
    throw new Error(`LLM returned invalid JSON for scoring: ${raw}`);
  }
}
