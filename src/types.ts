// Shared TypeScript interfaces for HireX

export interface JDCriteria {
  role_title: string;
  min_years_experience: number;
  max_years_experience: number;   // 0 = no upper cap
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

export interface DimensionScore {
  dimension: string;
  evidence: string;
  score: number;
  reasoning: string;
}

export interface ScoreResult {
  overall_score: number;
  recommendation: "Interview" | "Maybe" | "Reject" | string;
  top_strengths: string[];
  key_gaps: string[];
  red_flags: string[];
  justification: string;
  dimension_scores?: DimensionScore[];
}

export interface ScoredCandidate extends CandidateRow {
  score_result: ScoreResult;
  error?: string;
}

export interface RubricAnchor {
  score_1: string; // description of what a score of 1 looks like
  score_3: string; // description of what a score of 3 looks like
  score_5: string; // description of what a score of 5 looks like
}

export interface RubricDimension {
  name: string;
  description: string;
  weight: number; // 0-1, all dimensions must sum to 1.0
  anchors: RubricAnchor;
}

export interface ScoringRubric {
  dimensions: RubricDimension[];
  generated_for: string; // role_title
}
