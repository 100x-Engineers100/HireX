import Papa from "papaparse";
import { CandidateRow } from "@/types";
import { normalizeHeader } from "@/lib/column-map";

// Parses a CSV string (from cohort file) into normalized CandidateRow array
// Alias used by the page.tsx client import
export const parseCohortCSV = parseCSV;

export function parseCSV(csvText: string, cohort: string): CandidateRow[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
  });

  if (result.errors.length > 0) {
    console.warn(`[csv-parser] ${cohort} parse warnings:`, result.errors.slice(0, 3));
  }

  const headers = result.meta.fields || [];

  // Build a mapping from raw header -> canonical field
  const headerMap: Record<string, string> = {};
  for (const raw of headers) {
    const canonical = normalizeHeader(raw);
    if (canonical) {
      headerMap[raw] = canonical;
    }
  }

  const candidates: CandidateRow[] = [];

  for (const row of result.data as Record<string, string>[]) {
    // Normalize the row into canonical fields
    const normalized: Record<string, string> = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const canonical = headerMap[rawKey];
      if (canonical && !normalized[canonical]) {
        normalized[canonical] = (value || "").trim();
      }
    }

    candidates.push({
      name: normalized.name || "",
      email: normalized.email || "",
      cohort,
      total_experience: normalized.total_experience || "",
      working_experience: normalized.working_experience || "",
      is_student: normalized.is_student || "",
      designation: normalized.designation || "",
      company: normalized.company || "",
      professional_journey: normalized.professional_journey || "",
      coding_familiarity: normalized.coding_familiarity || "",
      languages: normalized.languages || "",
      python_level: normalized.python_level || "",
      domain: normalized.domain || "",
      resume_url: normalized.resume_url || "",
      linkedin_url: normalized.linkedin_url || "",
    });
  }

  return candidates;
}
