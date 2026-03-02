// Test script for Stage: generate-rubric
// Run: npx tsx test-stage-rubric.ts

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { JDCriteria, ScoringRubric } from "./src/types";
import { buildRubricGenPrompt } from "./src/lib/prompts";

const JD1_TEXT = `
Senior Full Stack Engineer

We are looking for a Senior Full Stack Engineer to join our platform team.

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in Golang and Python
- Experience with Node.js and TypeScript
- SQL and NoSQL database experience (PostgreSQL, Firestore)
- Google Cloud Platform (GCP) experience
- Experience building scalable REST APIs and microservices
- Familiarity with Docker and Kubernetes

Responsibilities:
- Design and implement backend services in Golang
- Build frontend features using React and TypeScript
- Own end-to-end delivery of product features
- Collaborate with product and data teams
`;

const JD1_CRITERIA: JDCriteria = {
  role_title: "Senior Full Stack Engineer",
  min_years_experience: 5,
  experience_buckets_acceptable: ["3-8", "8-10", "10+"],
  required_domain: "software",
  required_skills: ["Golang", "Python", "Node.js", "TypeScript", "PostgreSQL", "GCP", "React", "Docker"],
  requires_working_experience: true,
  is_technical_role: true,
};

const JD3_TEXT = `
AI Visual Creative Specialist

We are building a generative art studio and need a creative technologist who bridges art and AI.

Requirements:
- Strong background in visual design, digital art, or motion graphics
- Hands-on experience with ComfyUI, Stable Diffusion, or similar generative AI tools
- Proficiency in Adobe Creative Suite (Photoshop, Illustrator, After Effects)
- Understanding of prompt engineering for image generation
- Portfolio demonstrating generative/AI-assisted artwork
- Familiarity with Python for scripting creative workflows
- Experience with ControlNet, LoRA fine-tuning is a plus

Responsibilities:
- Create AI-assisted visual content for campaigns and products
- Build and maintain custom ComfyUI pipelines
- Collaborate with engineering on generative tooling
- Experiment with new generative techniques and maintain a creative research practice
`;

const JD3_CRITERIA: JDCriteria = {
  role_title: "AI Visual Creative Specialist",
  min_years_experience: 2,
  experience_buckets_acceptable: ["1-3", "3-8"],
  required_domain: "design",
  required_skills: ["ComfyUI", "Stable Diffusion", "Adobe Creative Suite", "prompt engineering", "Python", "generative art", "ControlNet"],
  requires_working_experience: false,
  is_technical_role: false,
};

async function generateRubric(
  label: string,
  criteria: JDCriteria,
  rawJDText: string
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[TEST] ${label}`);
  console.log("=".repeat(60));

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey: key });
  const prompt = buildRubricGenPrompt(criteria, rawJDText);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const rubric = JSON.parse(raw) as ScoringRubric;

  console.log(`\nGenerated for: ${rubric.generated_for}`);
  console.log(`Dimensions count: ${rubric.dimensions.length}`);

  let weightSum = 0;
  rubric.dimensions.forEach((d, i) => {
    weightSum += d.weight;
    console.log(`\n  [${i + 1}] ${d.name} (weight: ${d.weight})`);
    console.log(`      ${d.description}`);
    console.log(`      score_1: ${d.anchors.score_1}`);
    console.log(`      score_3: ${d.anchors.score_3}`);
    console.log(`      score_5: ${d.anchors.score_5}`);
  });

  console.log(`\nWeight sum: ${weightSum.toFixed(3)}`);

  // Assertions
  let pass = true;
  if (rubric.dimensions.length < 3 || rubric.dimensions.length > 5) {
    console.log(`[FAIL] Dimension count out of range: ${rubric.dimensions.length}`);
    pass = false;
  }
  if (weightSum < 0.99 || weightSum > 1.01) {
    console.log(`[FAIL] Weights do not sum to 1.0: ${weightSum.toFixed(3)}`);
    pass = false;
  }
  if (pass) {
    console.log(`\n[PASS] ${label} rubric is valid`);
  }
}

async function main() {
  console.log("Starting rubric generation tests...");

  await generateRubric("JD1 - Senior Full Stack Engineer (Golang, Python, GCP)", JD1_CRITERIA, JD1_TEXT);
  await generateRubric("JD3 - AI Visual Creative (ComfyUI, generative art)", JD3_CRITERIA, JD3_TEXT);

  console.log("\n[DONE] All tests complete.");
}

main().catch((err) => {
  console.error("[ERROR]", err.message);
  process.exit(1);
});
