// test-stage2-new.ts
// Tests: buildScoringPrompt with rubric + OpenAI scoring call
// Run: npx tsx test-stage2-new.ts

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { buildScoringPrompt } from "./src/lib/prompts";
import { JDCriteria, ScoringRubric, ScoreResult } from "./src/types";

const criteria: JDCriteria = {
  role_title: "Software Engineer",
  min_years_experience: 3,
  experience_buckets_acceptable: ["3-8", "8-10", "10+"],
  required_domain: "software",
  required_skills: ["Python", "React", "REST APIs", "SQL", "Git"],
  requires_working_experience: true,
  is_technical_role: true,
};

const rubric: ScoringRubric = {
  generated_for: "Software Engineer",
  dimensions: [
    {
      name: "Technical Skills Match",
      description: "Alignment of candidate skills with required tech stack",
      weight: 0.45,
      anchors: {
        score_1: "No Python or React experience; only mentions unrelated tools",
        score_3: "Has Python or React but not both; limited REST API experience",
        score_5: "Proficient in Python and React; has built REST APIs and used SQL in projects",
      },
    },
    {
      name: "Years of Relevant Experience",
      description: "Total years of software engineering experience",
      weight: 0.35,
      anchors: {
        score_1: "Less than 1 year or no professional experience",
        score_3: "1-2 years of professional software engineering experience",
        score_5: "3+ years of professional software engineering experience with clear progression",
      },
    },
    {
      name: "Communication and Problem Articulation",
      description: "Ability to clearly articulate technical problems and solutions",
      weight: 0.20,
      anchors: {
        score_1: "Profile is vague, no mention of projects or outcomes",
        score_3: "Describes role but lacks specifics on impact or scope",
        score_5: "Clearly articulates projects, tech choices, and measurable outcomes",
      },
    },
  ],
};

const candidateProfile = `Name: Arjun Mehta
Designation: Software Engineer
Company: Thoughtworks
Total Experience: 3-8 years
Prior Work Experience: Yes
Student: No
Domain: software
Professional Journey: Built a full-stack inventory management system using React and FastAPI. Wrote Python data pipelines for ETL processing with PostgreSQL. Contributed to open source REST API libraries. Led a team of 2 junior developers.
Coding Familiarity: Very comfortable
Languages: Python, JavaScript, TypeScript, SQL
Python Level: Advanced`;

const resumeText = `Arjun Mehta - Software Engineer
Experience: 4 years

Thoughtworks (2021 - present)
- Developed React frontend for client logistics dashboard serving 10,000 daily users
- Built Python FastAPI backend with PostgreSQL; optimized queries reducing p95 latency by 40%
- Designed REST APIs consumed by 3 mobile applications
- Mentored 2 junior engineers on code review practices and Git workflows

Personal Projects:
- Open source Python library for API rate limiting (200+ GitHub stars)
- React + TypeScript personal finance tracker with D3.js charts

Education: B.Tech Computer Science, NIT Trichy, 2021
Skills: Python, React, TypeScript, FastAPI, PostgreSQL, SQL, Git, Docker, REST APIs`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("[ERROR] OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: key });

  console.log("[*] Building scoring prompt with rubric...");
  const prompt = buildScoringPrompt(criteria, rubric, candidateProfile, resumeText);
  console.log("[OK] Prompt built. Length:", prompt.length, "chars");
  console.log("\n--- Prompt Preview (first 500 chars) ---");
  console.log(prompt.slice(0, 500));
  console.log("--- End Preview ---\n");

  console.log("[*] Calling OpenAI gpt-4o-mini...");
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let result: ScoreResult;
  try {
    result = JSON.parse(raw) as ScoreResult;
  } catch {
    console.error("[ERROR] LLM returned invalid JSON:", raw);
    process.exit(1);
  }

  console.log("[OK] Response received\n");

  // Verify dimension_scores
  if (!result.dimension_scores || !Array.isArray(result.dimension_scores)) {
    console.error("[ERROR] dimension_scores missing from response");
    process.exit(1);
  }

  if (result.dimension_scores.length !== rubric.dimensions.length) {
    console.error(
      `[ERROR] Expected ${rubric.dimensions.length} dimension scores, got ${result.dimension_scores.length}`
    );
    process.exit(1);
  }

  console.log("=== Dimension Scores ===");
  for (const ds of result.dimension_scores) {
    console.log(`\nDimension: ${ds.dimension}`);
    console.log(`  Score:     ${ds.score}/5`);
    console.log(`  Evidence:  ${ds.evidence}`);
    console.log(`  Reasoning: ${ds.reasoning}`);
  }

  console.log("\n=== Overall Result ===");
  console.log(`Overall Score:   ${result.overall_score}/10`);
  console.log(`Recommendation:  ${result.recommendation}`);
  console.log(`Top Strengths:   ${result.top_strengths.join("; ")}`);
  console.log(`Key Gaps:        ${result.key_gaps.join("; ")}`);
  console.log(`Red Flags:       ${result.red_flags.join("; ") || "none"}`);
  console.log(`Justification:   ${result.justification}`);

  console.log("\n[OK] All checks passed. Stage 2 scoring is working correctly.");
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
