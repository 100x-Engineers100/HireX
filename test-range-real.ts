// End-to-end test: min-max range filter against real cohort data
// JD: Senior Full Stack Engineer, 3-5 years, software domain, technical role
import { parseCohortCSV } from "./src/lib/csv-parser";
import { preFilter } from "./src/lib/pre-filter";
import type { JDCriteria } from "./src/types";
import * as fs from "fs";
import * as path from "path";

// --- TEST CASE A: Senior Full Stack Engineer (3-5 years) ---
const criteriaA: JDCriteria = {
  role_title: "Senior Full Stack Engineer",
  min_years_experience: 3,
  max_years_experience: 5,
  experience_buckets_acceptable: ["3-8"],
  required_domain: "software",
  required_skills: ["Golang", "Python", "NodeJS", "SQL", "REST APIs", "GCP"],
  requires_working_experience: true,
  is_technical_role: true,
};

// --- TEST CASE B: AI Visual Designer fresher (0-1 year) ---
const criteriaB: JDCriteria = {
  role_title: "AI Visual Designer",
  min_years_experience: 0,
  max_years_experience: 1,
  experience_buckets_acceptable: ["<1"],
  required_domain: "design",
  required_skills: ["ComfyUI", "Blender", "motion graphics"],
  requires_working_experience: false,
  is_technical_role: false,
};

// Use A for the main run - change to criteriaB to test fresher
const criteria = criteriaA;

// OLD criteria (no max cap) - to show what changed
const criteriaOLD: JDCriteria = {
  ...criteria,
  max_years_experience: 0,
};

const cohorts = [
  { id: "C4", file: "./public/data/c4.csv" },
  { id: "C5", file: "./public/data/c5.csv" },
  { id: "C6", file: "./public/data/c6.csv" },
];

let allCandidates: ReturnType<typeof parseCohortCSV> = [];

console.log("=".repeat(60));
console.log("HireX - End-to-End Range Filter Test");
console.log("JD: AI Visual Designer - Entry Level (0-2 years, design) [user edited max to 2]");
console.log("=".repeat(60));

for (const cohort of cohorts) {
  const filePath = path.resolve(__dirname, cohort.file);
  if (!fs.existsSync(filePath)) {
    console.log(`[WARN] ${cohort.file} not found, skipping`);
    continue;
  }
  const csv = fs.readFileSync(filePath, "utf-8");
  const rows = parseCohortCSV(csv, cohort.id);
  allCandidates.push(...rows);
}

console.log(`\nTotal candidates loaded: ${allCandidates.length}`);

// --- OLD filter (min only, no cap) ---
const oldResult = preFilter(allCandidates, criteriaOLD);
console.log(`\n[OLD filter - min>=3, no max cap]`);
console.log(`  Passed: ${oldResult.passed.length} / ${oldResult.total}`);

// --- NEW filter (min=3, max=5) ---
const newResult = preFilter(allCandidates, criteria);
console.log(`\n[NEW filter - min=3, max=5]`);
console.log(`  Passed: ${newResult.passed.length} / ${newResult.total}`);

// --- Show who got excluded by the max cap ---
const oldIds = new Set(oldResult.passed.map((c) => c.email));
const newIds = new Set(newResult.passed.map((c) => c.email));
const excluded = oldResult.passed.filter((c) => !newIds.has(c.email));

console.log(`\n[Candidates EXCLUDED by max=5 cap (over-qualified)]: ${excluded.length}`);
if (excluded.length > 0) {
  console.log("  Name                     | Exp Bucket | Domain");
  console.log("  " + "-".repeat(55));
  for (const c of excluded.slice(0, 20)) {
    const name = (c.name || "Unknown").padEnd(24);
    const exp = (c.total_experience || "?").padEnd(10);
    const domain = c.domain || "?";
    console.log(`  ${name} | ${exp} | ${domain}`);
  }
  if (excluded.length > 20) {
    console.log(`  ... and ${excluded.length - 20} more`);
  }
} else {
  console.log("  None - no over-qualified candidates found in cohort data");
}

// --- Breakdown of NEW shortlist by exp bucket ---
console.log(`\n[NEW shortlist breakdown by experience bucket]:`);
const bucketCount: Record<string, number> = {};
for (const c of newResult.passed) {
  const b = c.total_experience?.trim() || "unknown";
  bucketCount[b] = (bucketCount[b] || 0) + 1;
}
for (const [bucket, count] of Object.entries(bucketCount).sort()) {
  console.log(`  ${bucket.padEnd(8)}: ${count} candidates`);
}

// --- Verify no 8-10 or >10 slipped through ---
const leaked = newResult.passed.filter((c) => {
  const exp = c.total_experience?.trim();
  return exp === "3-8" || exp === "8-10" || exp === ">10" || exp === "10+";
});
console.log(`\n[CRITICAL CHECK] Over-qualified (>2yr) candidates in new shortlist: ${leaked.length}`);
if (leaked.length === 0) {
  console.log("  [OK] Max cap correct - only <1yr and 1-3yr (midpoint 2) passed through");
} else {
  console.log("  [ERROR] Max cap NOT working - these slipped through:");
  for (const c of leaked) {
    console.log(`    ${c.name} | ${c.total_experience}`);
  }
}

// --- Sample of final shortlist ---
console.log(`\n[Sample of final shortlist (first 10)]:`);
console.log("  Name                     | Exp   | Domain          | Has Resume");
console.log("  " + "-".repeat(65));
for (const c of newResult.passed.slice(0, 10)) {
  const name = (c.name || "?").padEnd(24);
  const exp  = (c.total_experience || "?").padEnd(5);
  const dom  = (c.domain || "?").padEnd(15);
  const res  = c.resume_url ? "YES" : "NO";
  console.log(`  ${name} | ${exp} | ${dom} | ${res}`);
}

console.log("\n" + "=".repeat(60));
console.log("Test complete");
