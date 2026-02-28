import { CandidateRow, JDCriteria } from "@/types";

// Actual CSV values: '<1', '1-3', '3-8', '8-10', '>10'
// Range boundaries for overlap-based filtering (avoids midpoint approximation errors)
const BUCKET_RANGE: Record<string, [number, number]> = {
  "<1":  [0, 1],
  "0-1": [0, 1],   // fallback alias
  "1-3": [1, 3],
  "3-8": [3, 8],
  "8-10":[8, 10],
  ">10": [10, 99],
  "10+": [10, 99],  // fallback alias
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

    // Rule 2: Experience range check (bucket overlap — no midpoint approximation)
    // Reject bucket only when it lies entirely outside [min, max].
    // bucketMax <= min  → bucket is fully below the floor (strict: e.g. 1-3 is excluded for min=3)
    // bucketMin > max   → bucket is fully above the cap
    {
      const range = BUCKET_RANGE[c.total_experience.trim()];
      if (range) {
        const [bucketMin, bucketMax] = range;
        const min = criteria.min_years_experience;
        const max = criteria.max_years_experience; // 0 = no cap
        if (min > 0 && bucketMax <= min) continue;
        if (max > 0 && bucketMin >= max) continue;
      }
      // unknown bucket: falls through (no data = not penalised)
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
