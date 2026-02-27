import { JDCriteria } from "@/types";

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
  candidateProfile: string,
  resumeText: string
): string {
  const resumeSection = resumeText
    ? `Resume Text (extracted):\n${resumeText.slice(0, 3000)}`
    : "Resume: Not available";

  return `You are a senior technical recruiter scoring a candidate for a job.

Job Requirements:
- Role: ${criteria.role_title}
- Min Experience: ${criteria.min_years_experience} years
- Domain: ${criteria.required_domain}
- Required Skills: ${criteria.required_skills.join(", ")}
- Technical Role: ${criteria.is_technical_role}
- Requires Prior Work Experience: ${criteria.requires_working_experience}

Candidate Profile (form data):
${candidateProfile}

${resumeSection}

Score this candidate on a scale of 1-10 for this specific role.
Return ONLY valid JSON:
{
  "overall_score": number (1-10),
  "recommendation": "Interview" | "Maybe" | "Reject",
  "top_strengths": string[] (max 3, concise),
  "key_gaps": string[] (max 3, concise),
  "red_flags": string[] (max 2, only serious issues),
  "justification": string (2-3 sentences max)
}

Scoring guide:
- 8-10: Strong match, clear Interview
- 5-7: Partial match, Maybe
- 1-4: Poor match, Reject

No markdown, no extra fields.`;
}

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
