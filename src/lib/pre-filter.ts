import { CandidateRow, JDCriteria } from "@/types";

// Maps experience bucket string to approximate years
// Actual CSV values: '<1', '1-3', '3-8', '8-10', '>10'
const EXP_BUCKET_YEARS: Record<string, number> = {
  "<1":  0.5,
  "0-1": 0.5,  // fallback alias
  "1-3": 2,
  "3-8": 5,
  "8-10": 9,
  ">10": 11,
  "10+": 11,   // fallback alias
};

const NO_CODE_VALUES = [
  "i've never coded",
  "i'm not familiar at all",
  "not familiar",
  "never coded",
  "no coding",
];

// Returns candidates that pass the pre-filter for a given JD, sorted by domain relevance
export function preFilter(
  candidates: CandidateRow[],
  criteria: JDCriteria
): { passed: CandidateRow[]; total: number } {
  const total = candidates.length;
  const passed: CandidateRow[] = [];

  for (const c of candidates) {
    // Rule 1: Must have resume URL
    if (!c.resume_url || c.resume_url.trim() === "") continue;

    // Rule 2: Experience bucket check
    if (criteria.min_years_experience > 0) {
      const years = EXP_BUCKET_YEARS[c.total_experience.trim()] ?? -1;
      if (years < criteria.min_years_experience) continue;
    }

    // Rule 3: Working experience required
    // Only drop explicit "No" — empty means Tally conditional field not shown, not "no experience"
    if (criteria.requires_working_experience) {
      const hasWorked = c.working_experience.toLowerCase().trim();
      if (hasWorked === "no") continue;
    }

    // Rule 4: Technical role - must have some coding familiarity
    if (criteria.is_technical_role) {
      const coding = c.coding_familiarity.toLowerCase().trim();
      if (NO_CODE_VALUES.some((v) => coding.includes(v))) continue;
    }

    passed.push(c);
  }

  // Domain sort: bring matching domain candidates first
  const domain = criteria.required_domain.toLowerCase();
  passed.sort((a, b) => {
    const aMatch = a.domain.toLowerCase().includes(domain) ? 0 : 1;
    const bMatch = b.domain.toLowerCase().includes(domain) ? 0 : 1;
    return aMatch - bMatch;
  });

  return { passed, total };
}
