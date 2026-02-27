import { JDCriteria, ScoringRubric } from "@/types";

export function buildJDParsePrompt(jdText: string): string {
  return `You are a recruitment assistant. Extract structured hiring criteria from the job description below.

Return ONLY valid JSON matching this schema exactly:
{
  "role_title": string,
  "min_years_experience": number,
  "experience_buckets_acceptable": string[],  // from: ["0-1", "1-3", "3-8", "8-10", "10+"]
  "required_domain": "software" | "product" | "design" | "data" | "operations" | "other",
  "required_skills": string[],
  "requires_working_experience": boolean,
  "is_technical_role": boolean
}

Rules:
- experience_buckets_acceptable: list all buckets >= min_years_experience
- required_skills: max 8, most important only
- No extra fields, no markdown, no explanation

Job Description:
---
${jdText}
---`;
}

export function buildScoringPrompt(
  criteria: JDCriteria,
  rubric: ScoringRubric,
  candidateProfile: string,
  resumeText: string
): string {
  const resumeSection = resumeText
    ? `Resume Text (extracted):\n${resumeText.slice(0, 6000)}`
    : "Resume: Not available";

  const dimensionLines = rubric.dimensions
    .map(
      (d, i) =>
        `Dimension ${i + 1}: ${d.name} (weight: ${d.weight})\n` +
        `  Description: ${d.description}\n` +
        `  Score 1 (weak): ${d.anchors.score_1}\n` +
        `  Score 3 (moderate): ${d.anchors.score_3}\n` +
        `  Score 5 (strong): ${d.anchors.score_5}`
    )
    .join("\n\n");

  return `You are a senior technical recruiter scoring a candidate using a structured rubric.

Job Requirements:
- Role: ${criteria.role_title}
- Min Experience: ${criteria.min_years_experience} years
- Domain: ${criteria.required_domain}
- Required Skills: ${criteria.required_skills.join(", ")}
- Technical Role: ${criteria.is_technical_role}
- Requires Prior Work Experience: ${criteria.requires_working_experience}

Scoring Rubric:
${dimensionLines}

Candidate Profile (form data):
${candidateProfile}

${resumeSection}

Instructions:
1. For each rubric dimension, extract specific evidence from the resume/profile text.
2. Score each dimension 1-5 using the anchor descriptions provided.
3. Scoring floor rule: score 1 ONLY when there is explicit evidence of absence (e.g. candidate states they have never used a skill, or their entire background is unrelated). If evidence is simply absent or not mentioned, score 2 minimum - absence of data is not proof of inability.
4. Do NOT compute overall_score - it will be calculated server-side.
5. top_strengths and key_gaps must reference specific skills or facts from the resume, not generic observations.

Return ONLY valid JSON with no markdown, no extra fields:
{
  "dimension_scores": [
    {
      "dimension": "dimension name",
      "evidence": "specific text or evidence found in resume/profile",
      "score": 4,
      "reasoning": "one sentence explaining the score"
    }
  ],
  "overall_score": 0,
  "recommendation": "TBD",
  "top_strengths": ["max 3, must be specific facts from resume"],
  "key_gaps": ["max 3, must reference specific missing skills or requirements"],
  "red_flags": ["max 2, only serious verifiable issues"],
  "justification": "2-3 sentences referencing specific evidence"
}`;
}

export function buildRubricGenPrompt(criteria: JDCriteria, rawJDText: string): string {
  const domainHint =
    criteria.required_domain === "design"
      ? "This is a creative/design role. Prioritize dimensions like visual background, creative tool familiarity, portfolio quality, and aesthetic sensibility."
      : criteria.is_technical_role
      ? "This is a technical role. Prioritize dimensions like specific skills match, technical depth, system design ability, and engineering experience."
      : "This is a hybrid role. Balance technical and non-technical dimensions appropriately.";

  return `You are a senior technical recruiter building a scoring rubric for hiring.

Role: ${criteria.role_title}
Domain: ${criteria.required_domain}
Required Skills: ${criteria.required_skills.join(", ")}
Min Experience: ${criteria.min_years_experience} years
Technical Role: ${criteria.is_technical_role}

${domainHint}

Full Job Description:
---
${rawJDText.slice(0, 2000)}
---

Generate 4-5 scoring dimensions for evaluating candidates for this specific role.

Rules:
- Each dimension must be directly relevant to THIS role, not generic
- Anchors (score_1, score_3, score_5) must reference specific skills, tools, or requirements from the JD
- Weights must be decimals that sum to exactly 1.0
- No generic anchors like "poor", "average", "excellent" - be concrete
- ONLY include dimensions that can be objectively evaluated from a resume or written profile
- FORBIDDEN dimensions: "adaptability", "learning mindset", "passion", "collaboration", "communication", "culture fit", "attitude" - these cannot be verified from a resume
- ALLOWED dimensions: specific technical skills, years of experience, domain knowledge, tool/framework proficiency, system design evidence, project complexity
- Return ONLY valid JSON, no markdown, no explanation

Required JSON schema:
{
  "dimensions": [
    {
      "name": string,
      "description": string,
      "weight": number,
      "anchors": {
        "score_1": string,
        "score_3": string,
        "score_5": string
      }
    }
  ],
  "generated_for": "${criteria.role_title}"
}`;
}

// ScoringRubric is imported for type reference in buildRubricGenPrompt return consumers
export type { ScoringRubric };

export function formatCandidateProfile(c: {
  name: string;
  designation: string;
  company: string;
  total_experience: string;
  working_experience: string;
  is_student: string;
  professional_journey: string;
  coding_familiarity: string;
  languages: string;
  python_level: string;
  domain: string;
}): string {
  return [
    `Name: ${c.name}`,
    `Designation: ${c.designation}`,
    `Company: ${c.company}`,
    `Total Experience: ${c.total_experience} years`,
    `Prior Work Experience: ${c.working_experience}`,
    `Student: ${c.is_student}`,
    `Domain: ${c.domain}`,
    `Professional Journey: ${c.professional_journey?.slice(0, 500) || "N/A"}`,
    `Coding Familiarity: ${c.coding_familiarity}`,
    `Languages: ${c.languages}`,
    `Python Level: ${c.python_level}`,
  ].join("\n");
}
