"use client";

import React, { useState, useRef } from "react";
import JDConfirmModal from "@/components/JDConfirmModal";
import RubricApprovalModal from "@/components/RubricApprovalModal";
import { JDCriteria, ScoringRubric, DimensionScore } from "@/types";
import { SuccessIcon, DownloadDoneIcon, SendIcon } from "@/components/ui/animated-state-icons";

// ---- Types ----
type Stage = "idle" | "parsing-jd" | "pre-filtering" | "scoring" | "done" | "error";

interface ProgressState {
  stage: Stage;
  message: string;
  scored: number;
  total: number;
  currentCandidate: string;
}

// ---- Sub-components ----

function Spinner() {
  return (
    <span
      className="animate-spin-slow"
      style={{
        display: "inline-block",
        width: "12px",
        height: "12px",
        border: "1.5px solid rgba(249,104,70,0.2)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        flexShrink: 0,
      }}
    />
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "4px",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          background: "var(--bg-tertiary)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        --
      </span>
    );
  }

  const isHigh = score >= 8;
  const isMid = score >= 5 && score < 8;

  return (
    <span
      className={isHigh ? "interview-glow" : ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "4px",
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        background: isHigh ? "var(--green-dim)" : isMid ? "var(--yellow-dim)" : "var(--red-dim)",
        color: isHigh ? "var(--green)" : isMid ? "var(--yellow)" : "var(--red)",
        border: `1px solid ${isHigh ? "rgba(61,204,122,0.2)" : isMid ? "rgba(232,184,75,0.2)" : "rgba(224,82,82,0.2)"}`,
      }}
    >
      {score}
    </span>
  );
}

function RecBadge({ rec }: { rec: string }) {
  if (rec === "Interview") {
    return (
      <span
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderRadius: "3px",
          background: "var(--green-dim)",
          color: "var(--green)",
          border: "1px solid rgba(61,204,122,0.2)",
          textTransform: "uppercase",
        }}
      >
        Interview
      </span>
    );
  }
  if (rec === "Maybe") {
    return (
      <span
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderRadius: "3px",
          background: "var(--yellow-dim)",
          color: "var(--yellow)",
          border: "1px solid rgba(232,184,75,0.2)",
          textTransform: "uppercase",
        }}
      >
        Maybe
      </span>
    );
  }
  if (rec === "Reject") {
    return (
      <span
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderRadius: "3px",
          background: "var(--red-dim)",
          color: "var(--red)",
          border: "1px solid rgba(224,82,82,0.2)",
          textTransform: "uppercase",
        }}
      >
        Reject
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderRadius: "3px",
        background: "var(--bg-tertiary)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
        textTransform: "uppercase",
      }}
    >
      {rec || "--"}
    </span>
  );
}

const PIPELINE_STAGES = [
  { key: "parsing-jd", label: "PARSE JD", index: 0 },
  { key: "pre-filtering", label: "PRE-FILTER", index: 1 },
  { key: "scoring", label: "SCORE", index: 2 },
  { key: "done", label: "DONE", index: 3 },
] as const;

function PipelineStages({ stage }: { stage: Stage }) {
  const stageOrder: Stage[] = ["parsing-jd", "pre-filtering", "scoring", "done"];
  const currentIdx = stageOrder.indexOf(stage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {PIPELINE_STAGES.map(({ key, label, index }) => {
        const isComplete = currentIdx > index || (stage === "done" && key === "done");
        const isActive = stage === key && key !== "done";

        return (
          <div key={key} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Dot */}
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isComplete
                    ? "var(--green)"
                    : isActive
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  transition: "background 0.3s ease",
                  boxShadow: isActive ? "0 0 6px var(--accent)" : "none",
                }}
              />
              {/* Label */}
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.06em",
                  color: isComplete
                    ? "var(--green)"
                    : isActive
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  transition: "color 0.3s ease",
                }}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {index < 3 && (
              <div
                style={{
                  width: "28px",
                  height: "1px",
                  margin: "0 8px",
                  background: currentIdx > index
                    ? "var(--green)"
                    : "var(--border-strong)",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Main Page ----
export default function Home() {
  const [jdText, setJdText] = useState("");
  const [progress, setProgress] = useState<ProgressState>({
    stage: "idle",
    message: "",
    scored: 0,
    total: 0,
    currentCandidate: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const [roleTitle, setRoleTitle] = useState("screening");
  const [error, setError] = useState("");
  const abortRef = useRef(false);

  // Modal flow state
  const [showJDConfirm, setShowJDConfirm] = useState(false);
  const [parsedCriteria, setParsedCriteria] = useState<JDCriteria | null>(null);
  const [confirmedCriteria, setConfirmedCriteria] = useState<JDCriteria | null>(null);
  const [showRubricApproval, setShowRubricApproval] = useState(false);
  const [approvedRubric, setApprovedRubric] = useState<ScoringRubric | null>(null);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isRunning = ["parsing-jd", "pre-filtering", "scoring"].includes(progress.stage);

  // Step 1: Parse JD only, then show modal
  async function handleParseJD() {
    if (!jdText.trim()) {
      setError("Paste a job description to get started.");
      return;
    }
    setError("");
    setConfirmedCriteria(null);
    setApprovedRubric(null);
    setResults([]);
    abortRef.current = false;

    setProgress({ stage: "parsing-jd", message: "Parsing job description...", scored: 0, total: 0, currentCandidate: "" });

    try {
      const res = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText }),
      });
      if (!res.ok) throw new Error(`JD parse failed: ${res.status}`);
      const criteria: JDCriteria = await res.json();
      if (criteria.role_title) setRoleTitle(criteria.role_title);
      setParsedCriteria(criteria);
      setProgress((p) => ({ ...p, stage: "idle" }));
      setShowJDConfirm(true);
    } catch (err) {
      setError(`Failed to parse JD: ${(err as Error).message}`);
      setProgress((p) => ({ ...p, stage: "error" }));
    }
  }

  // Modal 1 confirm: save criteria, generate rubric, show modal 2
  async function handleCriteriaConfirm(edited: JDCriteria) {
    setConfirmedCriteria(edited);
    setShowJDConfirm(false);
    setIsGeneratingRubric(true);

    try {
      const res = await fetch("/api/generate-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: edited, rawJDText: jdText }),
      });
      if (!res.ok) throw new Error(`Rubric generation failed: ${res.status}`);
      const { rubric }: { rubric: ScoringRubric } = await res.json();
      setIsGeneratingRubric(false);
      setApprovedRubric(rubric); // temporarily stored; replaced when user approves edits
      setShowRubricApproval(true);
    } catch (err) {
      setIsGeneratingRubric(false);
      setError(`Failed to generate rubric: ${(err as Error).message}`);
    }
  }

  // Modal 2 approve: save rubric, close modal
  function handleRubricApprove(edited: ScoringRubric) {
    setApprovedRubric(edited);
    setShowRubricApproval(false);
  }

  // Screen candidates (unlocked after rubric approved)
  async function handleScreenCandidates() {
    if (!confirmedCriteria || !approvedRubric) return;
    setError("");
    setResults([]);
    abortRef.current = false;

    // Pre-filter
    setProgress({ stage: "pre-filtering", message: "Loading cohort data...", scored: 0, total: 0, currentCandidate: "" });

    let shortlist: any[] = [];
    try {
      const { parseCohortCSV } = await import("@/lib/csv-parser");
      const { preFilter } = await import("@/lib/pre-filter");

      const cohorts: Array<{ id: "C4" | "C5" | "C6"; key: string }> = [
        { id: "C4", key: "c4" },
        { id: "C5", key: "c5" },
        { id: "C6", key: "c6" },
      ];

      for (const cohort of cohorts) {
        const res = await fetch(`/api/cohort-data?cohort=${cohort.key}`);
        if (!res.ok) throw new Error(`Failed to load ${cohort.id} data`);
        const csv = await res.text();
        const candidates = parseCohortCSV(csv, cohort.id);
        const { passed } = preFilter(candidates, confirmedCriteria);
        shortlist.push(...passed);
      }
    } catch (err) {
      setError(`Pre-filter failed: ${(err as Error).message}`);
      setProgress((p) => ({ ...p, stage: "error" }));
      return;
    }

    if (shortlist.length === 0) {
      setError("No candidates passed pre-filter. Try relaxing JD requirements.");
      setProgress((p) => ({ ...p, stage: "error" }));
      return;
    }

    // Score each candidate
    setProgress({
      stage: "scoring",
      message: `Found ${shortlist.length} candidates to screen`,
      scored: 0,
      total: shortlist.length,
      currentCandidate: "",
    });

    const scored: any[] = [];

    for (let i = 0; i < shortlist.length; i++) {
      if (abortRef.current) break;

      const candidate = shortlist[i];
      setProgress((p) => ({
        ...p,
        scored: i,
        currentCandidate: candidate.name,
        message: `Scoring ${candidate.name}...`,
      }));

      try {
        // Step 1: fetch + parse resume (serverless, Node runtime, fast ~2-3s)
        let resumeText = "";
        if (candidate.resume_url) {
          const resumeRes = await fetch("/api/fetch-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_url: candidate.resume_url }),
          });
          if (resumeRes.ok) {
            const resumeData = await resumeRes.json();
            resumeText = resumeData.text || "";
          }
        }

        // Step 2: score with pre-parsed text (Edge runtime, 30s limit)
        const res = await fetch("/api/score-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            criteria: confirmedCriteria,
            resume_text: resumeText,
            candidate,
            rubric: approvedRubric,
          }),
        });
        const scoreData = await res.json();
        scored.push({ ...candidate, score: scoreData });
        setResults([...scored]);
      } catch {
        scored.push({
          ...candidate,
          score: {
            overall_score: 0,
            recommendation: "Error",
            top_strengths: [],
            key_gaps: [],
            red_flags: ["Network error"],
            justification: "",
          },
        });
        setResults([...scored]);
      }

      if (i < shortlist.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setProgress((p) => ({
      ...p,
      stage: "done",
      scored: shortlist.length,
      message: "Screening complete.",
    }));
  }

  function toggleExpandRow(key: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleDownload() {
    const { generateExcel } = await import("@/lib/excel-generator");
    generateExcel(results, roleTitle);
  }

  function handleStop() {
    abortRef.current = true;
    setProgress((p) => ({ ...p, stage: "done", message: "Stopped by user." }));
  }

  const progressPct =
    progress.total > 0 ? Math.round((progress.scored / progress.total) * 100) : 0;

  const sortedResults = [...results].sort(
    (a, b) => (b.score?.overall_score ?? 0) - (a.score?.overall_score ?? 0)
  );

  const interviewCount = results.filter((r) => r.score?.recommendation === "Interview").length;
  const maybeCount = results.filter((r) => r.score?.recommendation === "Maybe").length;

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      {/* ---- Header ---- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "14px 24px",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderRadius: "14px",
            background: "rgba(8,8,8,0.72)",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 0 0 1px rgba(249,104,70,0.05), 0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "auto",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Icon mark: diamond + slash */}
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ flexShrink: 0 }}>
              {/* Coral diamond */}
              <rect
                x="7" y="7" width="16" height="16"
                rx="2"
                transform="rotate(45 15 15)"
                fill="#F96846"
              />
              {/* Inner slash — white */}
              <line x1="11" y1="19" x2="19" y2="11" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              {/* Small dot top-right */}
              <circle cx="21" cy="9" r="2" fill="#F96846" />
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "16px",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: "var(--text-primary)",
                }}
              >
                Hire<span style={{ color: "var(--accent)" }}>X</span>
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Resume Screener
              </span>
            </div>
          </div>

          {/* Right meta */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              C4 &bull; C5 &bull; C6
            </span>
            {/* Glassmorphism pill badge */}
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                padding: "4px 12px",
                borderRadius: "100px",
                border: "1px solid rgba(249,104,70,0.35)",
                color: "var(--accent)",
                background: "rgba(249,104,70,0.08)",
                backdropFilter: "blur(8px)",
                textTransform: "uppercase",
                boxShadow: "0 0 12px rgba(249,104,70,0.12)",
              }}
            >
              Internal
            </span>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 32px 80px",
        }}
      >
        {/* ---- Hero ---- */}
        <div style={{ marginBottom: "56px", position: "relative", paddingTop: "16px" }}>

          {/* Glow blob — bottom left */}
          <div
            aria-hidden="true"
            className="glow-blob"
            style={{
              width: "600px",
              height: "360px",
              bottom: "-80px",
              left: "-120px",
              opacity: 0.8,
            }}
          />
          {/* Glow blob — top right (smaller, dimmer) */}
          <div
            aria-hidden="true"
            className="glow-blob"
            style={{
              width: "320px",
              height: "220px",
              top: "-40px",
              right: "-60px",
              opacity: 0.4,
              background: "rgba(249,104,70,0.07)",
              filter: "blur(80px)",
            }}
          />

          {/* Ghost watermark — decorative right-side typographic element */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "0px",
              right: "-2px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "clamp(80px, 15vw, 130px)",
              letterSpacing: "-0.06em",
              color: "transparent",
              WebkitTextStroke: "1px rgba(249,104,70,0.07)",
              pointerEvents: "none",
              userSelect: "none",
              lineHeight: 1,
              whiteSpace: "nowrap",
              textAlign: "right",
              writingMode: "horizontal-tb",
            }}
          >
            HIREX
            <br />

          </div>

          {/* Status badge */}




          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(34px, 5vw, 52px)",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "var(--text-primary)",
              marginBottom: "16px",
              position: "relative",
            }}
          >
            Ranked Candidate
            <br />
            <span
              style={{
                color: "var(--accent)",
                position: "relative",
                display: "inline-block",
              }}
            >
              Shortlist
              {/* Underline glow */}
              <span
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, var(--accent), transparent)",
                  borderRadius: "2px",
                }}
              />
            </span>
            {" "}&mdash; Instantly.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.85,
              letterSpacing: "0.01em",
              maxWidth: "500px",
              marginBottom: "28px",
            }}
          >
            Paste a JD. The engine pre-filters 880+ cohort candidates,
            fetches each resume, and returns an LLM-scored shortlist
            ready for download in under 5 minutes.
          </p>

          {/* Stats row — glassmorphism cards */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "1px" }}>
            {[
              { label: "Cohorts", value: "C4–C6", sub: "3 batches" },
              { label: "Candidates", value: "880+", sub: "pre-filtered" },
              { label: "Avg. Runtime", value: "~4 min", sub: "end-to-end" },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                style={{
                  padding: "14px 24px",
                  background: i === 0
                    ? "rgba(249,104,70,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: "1px solid",
                  borderColor: i === 0
                    ? "rgba(249,104,70,0.2)"
                    : "rgba(255,255,255,0.05)",
                  borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : "0",
                  backdropFilter: "blur(8px)",
                  minWidth: "110px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "20px",
                    letterSpacing: "-0.03em",
                    color: i === 0 ? "var(--accent)" : "var(--text-primary)",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.04em",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    opacity: 0.6,
                  }}
                >
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- JD Input Panel ---- */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-strong)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "24px",
            boxShadow: "0 0 0 1px rgba(249,104,70,0.04), 0 4px 24px rgba(0,0,0,0.3)",
            // top accent bar via background gradient
            backgroundImage: "linear-gradient(to bottom, rgba(249,104,70,0.06) 0px, transparent 52px)",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "13px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* macOS-style window dots */}
              <div style={{ display: "flex", gap: "5px" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#28c840" }} />
              </div>
              <div style={{ width: "1px", height: "14px", background: "var(--border)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                job_description.txt
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: jdText.length > 0 ? "var(--accent)" : "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {jdText.length > 0 ? `${jdText.length} chars` : "min: title + skills + exp"}
            </span>
          </div>

          {/* Textarea */}
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={"Paste the full job description here...\n\nInclude: role title, required skills, years of experience, domain."}
            disabled={isRunning}
            rows={11}
            style={{
              width: "100%",
              padding: "16px",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "12px",
              lineHeight: 1.8,
              resize: "none",
              border: "none",
              outline: "none",
              opacity: isRunning ? 0.45 : 1,
              letterSpacing: "0.01em",
            }}
          />

          {/* Footer bar */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {isRunning && (
              <button
                onClick={handleStop}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "7px 16px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                STOP
              </button>
            )}
            <button
              onClick={handleParseJD}
              disabled={isRunning || progress.stage === "parsing-jd" || !jdText.trim()}
              className={!isRunning && jdText.trim() ? "shimmer-btn" : ""}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "8px 22px",
                borderRadius: "6px",
                border: "none",
                background: isRunning || !jdText.trim() ? "var(--bg-tertiary)" : "var(--accent)",
                color: isRunning || !jdText.trim() ? "var(--text-muted)" : "#000",
                cursor: isRunning || !jdText.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.15s ease",
              }}
            >
              {progress.stage === "parsing-jd" ? (
                <>
                  <Spinner />
                  <span>PARSING JD...</span>
                </>
              ) : (
                <>
                  <SendIcon size={14} color="#000" controlled={false} />
                  PARSE JD
                </>
              )}
            </button>
          </div>
        </div>

        {/* ---- JD Parse Status + Screen Button ---- */}
        {(confirmedCriteria || approvedRubric || isGeneratingRubric) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(249,104,70,0.15)",
              background: "rgba(249,104,70,0.04)",
              backdropFilter: "blur(12px)",
              marginBottom: "16px",
              gap: "16px",
              flexWrap: "wrap",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {confirmedCriteria && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--accent)",
                    letterSpacing: "0.04em",
                  }}
                >
                  [OK] Criteria confirmed: {confirmedCriteria.role_title}
                </span>
              )}
              {isGeneratingRubric && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <Spinner /> Generating rubric...
                </span>
              )}
              {approvedRubric && !isGeneratingRubric && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--green)",
                    letterSpacing: "0.04em",
                  }}
                >
                  [OK] Rubric approved: {approvedRubric.dimensions.length} dimensions
                </span>
              )}
            </div>
            <button
              onClick={handleScreenCandidates}
              disabled={!approvedRubric || isRunning}
              className={approvedRubric && !isRunning ? "shimmer-btn" : ""}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "9px 22px",
                borderRadius: "6px",
                border: "none",
                background: approvedRubric && !isRunning ? "var(--accent)" : "var(--bg-tertiary)",
                color: approvedRubric && !isRunning ? "#000" : "var(--text-muted)",
                cursor: approvedRubric && !isRunning ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {isRunning ? (
                <>
                  <Spinner />
                  <span>RUNNING...</span>
                </>
              ) : (
                "SCREEN CANDIDATES"
              )}
            </button>
          </div>
        )}

        {/* ---- Error ---- */}
        {error && (
          <div
            className="animate-fade-up"
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              background: "var(--red-dim)",
              border: "1px solid rgba(224,82,82,0.2)",
              color: "var(--red)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            [ERROR] {error}
          </div>
        )}

        {/* ---- Progress Panel ---- */}
        {progress.stage !== "idle" && progress.stage !== "error" && (
          <div
            className="animate-fade-up"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "32px",
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "16px",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                {isRunning && <Spinner />}
                {progress.stage === "done" && (
                  <SuccessIcon size={20} color="var(--green)" controlled={true} />
                )}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: progress.stage === "done" ? "var(--green)" : "var(--text-primary)",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {progress.message}
                </span>
              </div>
              {progress.total > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {progress.scored}/{progress.total}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {progress.total > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    height: "3px",
                    borderRadius: "2px",
                    background: "var(--bg-tertiary)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className={isRunning ? "progress-bar-active" : ""}
                    style={{
                      height: "100%",
                      borderRadius: "2px",
                      width: `${progressPct}%`,
                      background: progress.stage === "done" ? "var(--green)" : "var(--accent)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                {progress.currentCandidate && isRunning && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginTop: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    &gt; {progress.currentCandidate}
                  </p>
                )}
              </div>
            )}

            {/* Pipeline stages */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <PipelineStages stage={progress.stage} />
            </div>
          </div>
        )}

        {/* ---- Results ---- */}
        {results.length > 0 && (
          <div className="animate-fade-up">
            {/* Results header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "16px",
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                  }}
                >
                  Results
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      background: "var(--green-dim)",
                      color: "var(--green)",
                      border: "1px solid rgba(61,204,122,0.2)",
                    }}
                  >
                    {interviewCount} INTERVIEW
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      background: "var(--yellow-dim)",
                      color: "var(--yellow)",
                      border: "1px solid rgba(232,184,75,0.2)",
                    }}
                  >
                    {maybeCount} MAYBE
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {results.length} total
                  </span>
                </div>
              </div>

              {progress.stage === "done" && (
                <button
                  onClick={handleDownload}
                  className="shimmer-btn"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "7px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent)",
                    color: "#000",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <DownloadDoneIcon size={16} color="#000" controlled={true} />
                  Download Excel
                </button>
              )}
            </div>

            {/* Table */}
            <div
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "860px" }}>
                  <colgroup>
                    <col style={{ width: "48px" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "76px" }} />
                    <col style={{ width: "68px" }} />
                    <col style={{ width: "96px" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "76px" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr
                      style={{
                        background: "var(--bg-tertiary)",
                        borderBottom: "1px solid var(--border-strong)",
                      }}
                    >
                      {[
                        { label: "#", align: "right" as const },
                        { label: "NAME / EMAIL", align: "left" as const },
                        { label: "COHORT", align: "center" as const },
                        { label: "SCORE", align: "center" as const },
                        { label: "REC", align: "center" as const },
                        { label: "DESIGNATION", align: "left" as const },
                        { label: "EXP", align: "center" as const },
                        { label: "DOMAIN", align: "left" as const },
                      ].map(({ label, align }) => (
                        <th
                          key={label}
                          style={{
                            textAlign: align,
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((c, i) => {
                      const rowKey = `${c.email}-${i}`;
                      const isExpanded = expandedRows.has(rowKey);
                      const dimScores: DimensionScore[] = c.score?.dimension_scores ?? [];
                      return (<React.Fragment key={rowKey}>
                        <tr
                          className="result-row"
                          onClick={() => dimScores.length > 0 && toggleExpandRow(rowKey)}
                          style={{
                            borderTop: "1px solid var(--border)",
                            background: i % 2 === 0 ? "var(--bg-panel)" : "var(--bg-secondary)",
                            cursor: dimScores.length > 0 ? "pointer" : "default",
                          }}
                        >
                          {/* Rank */}
                          <td
                            style={{
                              textAlign: "right",
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </td>

                          {/* Name + Email */}
                          <td>
                            <div
                              style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 600,
                                fontSize: "13px",
                                color: "var(--text-primary)",
                                letterSpacing: "-0.01em",
                                marginBottom: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                letterSpacing: "0.01em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.email}
                            </div>
                          </td>

                          {/* Cohort */}
                          <td style={{ textAlign: "center" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                padding: "3px 8px",
                                borderRadius: "3px",
                                border: "1px solid var(--accent-border)",
                                color: "var(--accent)",
                                background: "var(--accent-dim)",
                              }}
                            >
                              {c.cohort}
                            </span>
                          </td>

                          {/* Score */}
                          <td style={{ textAlign: "center" }}>
                            <ScoreBadge score={c.score?.overall_score ?? 0} />
                          </td>

                          {/* Recommendation */}
                          <td style={{ textAlign: "center" }}>
                            <RecBadge rec={c.score?.recommendation ?? ""} />
                          </td>

                          {/* Designation + Company */}
                          <td>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                marginBottom: "2px",
                              }}
                            >
                              {c.designation || "--"}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.company || "--"}
                            </div>
                          </td>

                          {/* Experience */}
                          <td
                            style={{
                              textAlign: "center",
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {c.total_experience || "--"}
                          </td>

                          {/* Domain */}
                          <td
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <div
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.domain || "--"}
                              {dimScores.length > 0 && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "9px",
                                    color: "var(--accent)",
                                    letterSpacing: "0.06em",
                                  }}
                                >
                                  {isExpanded ? "[-]" : "[+]"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && dimScores.length > 0 && (
                          <tr
                            key={`${rowKey}-expand`}
                            style={{
                              background: "var(--bg-tertiary)",
                              borderTop: "1px solid var(--border)",
                            }}
                          >
                            <td colSpan={8} style={{ padding: "12px 16px" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    {["Dimension", "Score", "Evidence"].map((h) => (
                                      <th
                                        key={h}
                                        style={{
                                          textAlign: "left",
                                          fontFamily: "var(--font-mono)",
                                          fontSize: "9px",
                                          fontWeight: 600,
                                          letterSpacing: "0.1em",
                                          color: "var(--text-muted)",
                                          textTransform: "uppercase",
                                          paddingBottom: "6px",
                                          borderBottom: "1px solid var(--border)",
                                        }}
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dimScores.map((ds, di) => (
                                    <tr key={di}>
                                      <td
                                        style={{
                                          fontFamily: "var(--font-mono)",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          color: "var(--text-secondary)",
                                          padding: "6px 8px 6px 0",
                                          whiteSpace: "nowrap",
                                          width: "160px",
                                          borderBottom: "1px solid var(--border)",
                                        }}
                                      >
                                        {ds.dimension}
                                      </td>
                                      <td
                                        style={{
                                          fontFamily: "var(--font-mono)",
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          color: ds.score >= 4 ? "var(--green)" : ds.score >= 3 ? "var(--yellow)" : "var(--red, #e05252)",
                                          padding: "6px 16px 6px 0",
                                          whiteSpace: "nowrap",
                                          width: "50px",
                                          fontVariantNumeric: "tabular-nums",
                                          borderBottom: "1px solid var(--border)",
                                        }}
                                      >
                                        {ds.score}/5
                                      </td>
                                      <td
                                        style={{
                                          fontFamily: "var(--font-mono)",
                                          fontSize: "11px",
                                          color: "var(--text-muted)",
                                          padding: "6px 0",
                                          lineHeight: 1.5,
                                          borderBottom: "1px solid var(--border)",
                                        }}
                                      >
                                        {ds.evidence || ds.reasoning || "--"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---- Empty State ---- */}
        {progress.stage === "idle" && results.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--border-strong)",
              borderRadius: "8px",
              padding: "60px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              [AWAITING INPUT]
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              Paste a JD above, click PARSE JD, confirm criteria and rubric, then screen.
            </p>
          </div>
        )}
      </main>

      {/* ---- Modals ---- */}
      {showJDConfirm && parsedCriteria && (
        <JDConfirmModal
          rawJD={jdText}
          criteria={parsedCriteria}
          onConfirm={handleCriteriaConfirm}
          onCancel={() => {
            setShowJDConfirm(false);
            setProgress((p) => ({ ...p, stage: "idle" }));
          }}
        />
      )}
      {showRubricApproval && approvedRubric && (
        <RubricApprovalModal
          rubric={approvedRubric}
          onApprove={handleRubricApprove}
          onBack={() => {
            setShowRubricApproval(false);
            setApprovedRubric(null);
            setShowJDConfirm(true);
          }}
        />
      )}

      {/* ---- Footer ---- */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 0",
          marginTop: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Mini logo repeat */}
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: "-0.03em",
                color: "var(--text-secondary)",
              }}
            >
              Hire<span style={{ color: "var(--accent)" }}>X</span>
            </span>
            <span style={{ width: "1px", height: "10px", background: "var(--border-strong)", display: "inline-block" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              &copy; {new Date().getFullYear()} HireX. All rights reserved.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              Powered by GPT
            </span>
            <span style={{ width: "1px", height: "10px", background: "var(--border-strong)", display: "inline-block" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              v1.0.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
