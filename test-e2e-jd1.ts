/**
 * End-to-end quality test using JD1 (Senior Full Stack Engineer - Sure Fintech)
 * REAL test: fetches actual resumes, full pipeline including PDF parse
 * Tests first 5 candidates that have fetchable resumes
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseCSV } from "./src/lib/csv-parser";
import { preFilter } from "./src/lib/pre-filter";
import { parseJD, scoreCandidate } from "./src/lib/llm";
import { buildRubricGenPrompt } from "./src/lib/prompts";
import { fetchResume } from "./src/lib/pdf-fetcher";
import { extractText } from "./src/lib/pdf-parser";
import OpenAI from "openai";
import { ScoringRubric, CandidateRow } from "./src/types";

const JD1 = `Senior Full Stack Engineer

About Us
At Sure, we're revolutionizing personal finance in India through technology. We're building a platform that puts the power back in users' hands, helping them make smarter financial decisions through data-driven insights.

What You'll Do
- Own and architect critical features from concept to deployment
- Build scalable, secure APIs and microservices
- Create engaging, responsive user interfaces that delight our users
- Collaborate with product and design teams to craft exceptional user experiences

What You Bring
- 3-5 years of experience in full-stack development
- Strong proficiency in Golang, Python, NodeJs
- Experience with SQL & NoSQL (Firebase) and RESTful APIs
- Knowledge of cloud services (GCP & Firebase preferred) & RabbitMQ / Kafka
- Passion for clean, maintainable code`;

function sep(label: string) {
  console.log("\n" + "=".repeat(60));
  console.log(label);
  console.log("=".repeat(60));
}

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ---- STEP 1: Parse JD ----
  sep("STEP 1: JD PARSE");
  const criteria = await parseJD(JD1);
  console.log(JSON.stringify(criteria, null, 2));

  // ---- STEP 2: Generate Rubric ----
  sep("STEP 2: RUBRIC GENERATION");
  const rubricPrompt = buildRubricGenPrompt(criteria, JD1);
  const rubricRes = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: rubricPrompt }],
    temperature: 0.1,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });
  const rubric: ScoringRubric = JSON.parse(rubricRes.choices[0].message.content || "{}");

  const weightSum = rubric.dimensions.reduce((s, d) => s + d.weight, 0);
  console.log(`Dimensions: ${rubric.dimensions.length} | Weight sum: ${weightSum.toFixed(3)}`);
  rubric.dimensions.forEach((d, i) => {
    console.log(`  [${i + 1}] "${d.name}" (w=${d.weight})`);
    console.log(`      score_5: ${d.anchors.score_5.slice(0, 90)}`);
  });

  // Rubric quality check
  const softKeywords = ["adapt", "collaborat", "passion", "attitude", "culture", "communicat", "learn"];
  const hasSoftDimension = rubric.dimensions.some(d =>
    softKeywords.some(kw => d.name.toLowerCase().includes(kw))
  );
  console.log(`\n[CHECK] Soft dimensions present: ${hasSoftDimension ? "[WARN] yes - soft dimensions found" : "[OK] none"}`);

  // ---- STEP 3: Load + Pre-filter ----
  sep("STEP 3: PRE-FILTER");
  const csvDir = path.join("public", "data");
  const allCandidates: CandidateRow[] = [];
  for (const file of ["c4.csv", "c5.csv", "c6.csv"]) {
    const text = fs.readFileSync(path.join(csvDir, file), "utf-8");
    allCandidates.push(...parseCSV(text, file.replace(".csv", "")));
  }
  console.log(`Total loaded: ${allCandidates.length}`);
  const { passed, total } = preFilter(allCandidates, criteria);
  console.log(`Pre-filter: ${passed.length} passed out of ${total}`);

  // ---- STEP 4: Find 5 candidates with fetchable resumes ----
  sep("STEP 4: FETCHING RESUMES + FULL SCORING");
  console.log("Finding first 5 candidates with fetchable resumes...\n");

  const scored: Array<{ candidate: CandidateRow; resumeText: string; resumeChars: number }> = [];
  let attempted = 0;

  for (const c of passed) {
    if (scored.length >= 5) break;
    attempted++;

    process.stdout.write(`  Trying ${c.name} (${c.resume_url?.slice(0, 50)})... `);
    let resumeText = "";
    try {
      const fetched = await fetchResume(c.resume_url);
      if (fetched) {
        resumeText = await extractText(fetched.buffer, fetched.mimeType);
        if (resumeText && resumeText.trim().length > 100) {
          console.log(`[OK] ${resumeText.length} chars`);
          scored.push({ candidate: c, resumeText, resumeChars: resumeText.length });
        } else {
          console.log(`[SKIP] resume too short (${resumeText?.length || 0} chars)`);
        }
      } else {
        console.log(`[SKIP] fetch returned null`);
      }
    } catch (err) {
      console.log(`[SKIP] ${(err as Error).message.slice(0, 60)}`);
    }
  }

  console.log(`\nFound ${scored.length} candidates with resumes (attempted ${attempted})`);

  if (scored.length === 0) {
    console.log("[FATAL] No resumes fetchable - check URL formats in CSV");
    return;
  }

  // ---- STEP 5: Score each with full resume ----
  sep("STEP 5: SCORING WITH FULL RESUME");

  for (let i = 0; i < scored.length; i++) {
    const { candidate: c, resumeText, resumeChars } = scored[i];
    console.log(`\n${"─".repeat(55)}`);
    console.log(`Candidate ${i + 1}: ${c.name}`);
    console.log(`Profile: ${c.designation} @ ${c.company} | ${c.total_experience} exp | domain: ${c.domain}`);
    console.log(`Languages (form): ${c.languages || "(blank)"}`);
    console.log(`Resume: ${resumeChars} chars fetched`);
    console.log(`Resume preview: ${resumeText.slice(0, 200).replace(/\n/g, " ")}...`);

    try {
      const result = await scoreCandidate(c, criteria, resumeText, rubric);

      console.log(`\n  Overall Score: ${result.overall_score}/10 | ${result.recommendation}`);
      console.log("  Dimension Scores:");
      result.dimension_scores?.forEach((ds) => {
        console.log(`    [${ds.score}/5] ${ds.dimension}`);
        console.log(`           Evidence: ${ds.evidence?.slice(0, 120)}`);
        console.log(`           Reasoning: ${ds.reasoning?.slice(0, 100)}`);
      });
      console.log(`  Strengths: ${JSON.stringify(result.top_strengths)}`);
      console.log(`  Gaps:      ${JSON.stringify(result.key_gaps)}`);
      console.log(`  Red flags: ${JSON.stringify(result.red_flags)}`);
      console.log(`  Justification: ${result.justification}`);

      // Math check
      const computed = rubric.dimensions.reduce((sum, dim, idx) => {
        const ds = result.dimension_scores?.[idx];
        return sum + ((ds?.score || 0) * dim.weight);
      }, 0) * 2;
      const mathOk = Math.abs(computed - result.overall_score) < 0.2;
      console.log(`  Math check: computed=${computed.toFixed(2)}, returned=${result.overall_score} ${mathOk ? "[OK]" : "[WARN]"}`);

      // Check: did LLM use resume evidence or just profile?
      const resumeEvidenceCount = result.dimension_scores?.filter(ds =>
        ds.evidence && !ds.evidence.includes("Not mentioned") && ds.evidence.length > 30
      ).length || 0;
      console.log(`  Evidence quality: ${resumeEvidenceCount}/${rubric.dimensions.length} dimensions have specific evidence`);

    } catch (err) {
      console.log(`  [ERROR] ${(err as Error).message}`);
    }
  }

  // ---- FINAL VERDICT ----
  sep("FINAL ASSESSMENT CHECKLIST");
  console.log("1. JD parse correct?");
  console.log("2. Rubric dimensions all verifiable/technical (no soft skills)?");
  console.log("3. Math correct on all candidates?");
  console.log("4. Evidence cites actual resume content (not just 'not mentioned')?");
  console.log("5. Scores differentiated across candidates (not all bunched 5-7)?");
  console.log("6. Recommendation matches human gut-feel from profile+resume?");
  console.log("7. Score 1 only appears for explicit contradictions, not missing data?");
}

main().catch((e) => { console.error("[FATAL]", e); process.exit(1); });
