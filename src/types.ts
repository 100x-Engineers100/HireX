// Shared TypeScript interfaces for HireX

export interface JDCriteria {
  role_title: string;
  min_years_experience: number;
  experience_buckets_acceptable: string[];
  required_domain: "software" | "product" | "design" | "data" | "operations" | "other";
  required_skills: string[];
  requires_working_experience: boolean;
  is_technical_role: boolean;
}

export interface CandidateRow {
  name: string;
  email: string;
  cohort: string;
  total_experience: string;
  working_experience: string;
  is_student: string;
  designation: string;
  company: string;
  professional_journey: string;
  coding_familiarity: string;
  languages: string;
  python_level: string;
  domain: string;
  resume_url: string;
  linkedin_url: string;
}

export interface ScoreResult {
  overall_score: number;
  recommendation: "Interview" | "Maybe" | "Reject" | string;
  top_strengths: string[];
  key_gaps: string[];
  red_flags: string[];
  justification: string;
}

export interface ScoredCandidate extends CandidateRow {
  score_result: ScoreResult;
  error?: string;
}
