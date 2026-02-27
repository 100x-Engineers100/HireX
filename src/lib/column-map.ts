// Maps canonical field names to possible raw CSV header strings
// Uses startsWith fuzzy match so partial/multi-line headers work

export const COLUMN_MAP: Record<string, string[]> = {
  name: [
    "hey there! could you share your name with us?",
    "could you share your name with us?",
    "name",
    "full name",
  ],
  email: [
    "what's the best email to reach you at? we'd love to stay in touch!",
    "what's the best email to reach you at?",
    "email",
    "email address",
  ],
  is_student: [
    "are you currently a student? let us know!",
    "are you currently a student?",
    "are you currently a student",
  ],
  working_experience: [
    "did you have any working experience before this?",
    "did you have any working experience before joining launchpad?",
    "did you have any working experience",
  ],
  company: [
    "please share your company/organisation name",
    "company/organisation name",
    "company name",
    "organisation name",
  ],
  designation: [
    "what is/was designation?",
    "what is/was your designation?",
    "designation",
    "current designation",
    "give us your latest designation and domain.",
  ],
  total_experience: [
    "total years of experience",
  ],
  professional_journey: [
    "tell us little bit about your professional journey",
    "tell us a little bit about your professional journey",
    "professional journey",
  ],
  coding_familiarity: [
    "how familiar are you with programming/coding?",
    "how familiar are you with programming / coding?",
    "coding familiarity",
  ],
  python_level: [
    "how familiar are you with python?",
    "python familiarity",
  ],
  languages: [
    "which languages are your familiar with?",
    "which languages are you familiar with?",
    "languages",
    "programming languages",
  ],
  domain: [
    "what domain are you in?",
    "domain",
  ],
  resume_url: [
    "resume",
    "cv/resume",
    "resume url",
    "cv",
  ],
  linkedin_url: [
    "linkedin",
    "linkedin url",
    "linkedin profile",
  ],
};

// Fuzzy-matches a raw CSV header to a canonical field name
// Uses startsWith so multi-line Tally headers match our shorter variants
export function normalizeHeader(raw: string): string | null {
  const normalized = raw.toLowerCase().trim();
  // Empty headers (Tally row-index column) must not match anything
  if (normalized === "") return null;
  for (const [canonical, variants] of Object.entries(COLUMN_MAP)) {
    for (const variant of variants) {
      if (normalized.startsWith(variant) || variant.startsWith(normalized)) {
        return canonical;
      }
    }
  }
  return null;
}
