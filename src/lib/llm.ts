import OpenAI from "openai";
import { JDCriteria, ScoreResult, ScoringRubric } from "@/types";
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
    max_completion_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(raw) as JDCriteria;
  } catch {
    throw new Error(`LLM returned invalid JSON for JD parse: ${raw}`);
  }
}

// Scores a single candidate against the JD criteria using a rubric
export async function scoreCandidate(
  candidate: CandidateRow,
  criteria: JDCriteria,
  resumeText: string,
  rubric: ScoringRubric
): Promise<ScoreResult> {
  const client = getClient();
  const profile = formatCandidateProfile(candidate);
  const prompt = buildScoringPrompt(criteria, rubric, profile, resumeText);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_completion_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    const result = JSON.parse(raw) as ScoreResult;

    // Compute overall_score from dimension scores + rubric weights (never trust LLM math)
    if (result.dimension_scores && result.dimension_scores.length === rubric.dimensions.length) {
      const weightedSum = rubric.dimensions.reduce((sum, dim, idx) => {
        return sum + (result.dimension_scores![idx].score * dim.weight);
      }, 0);
      result.overall_score = Math.round(weightedSum * 2 * 10) / 10;
      result.recommendation =
        result.overall_score >= 7 ? "Interview"
          : result.overall_score >= 4 ? "Maybe"
            : "Reject";
    }

    return result;
  } catch {
    throw new Error(`LLM returned invalid JSON for scoring: ${raw}`);
  }
}
