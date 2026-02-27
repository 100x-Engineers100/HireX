"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { JDCriteria } from "@/types";

interface JDConfirmModalProps {
  rawJD: string;
  criteria: JDCriteria;
  onConfirm: (edited: JDCriteria) => void;
  onCancel: () => void;
}

export default function JDConfirmModal({ rawJD, criteria, onConfirm, onCancel }: JDConfirmModalProps) {
  const [edited, setEdited] = useState<JDCriteria>({ ...criteria, required_skills: [...criteria.required_skills] });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const ALL_BUCKETS = ["<1", "1-3", "3-8", "8-10", ">10"];
  const BUCKET_MIN: Record<string, number> = { "<1": 0, "1-3": 1, "3-8": 3, "8-10": 8, ">10": 10 };

  function syncBuckets(minYears: number): string[] {
    return ALL_BUCKETS.filter((b) => BUCKET_MIN[b] >= minYears);
  }

  function addSkill() {
    const s = newSkill.trim();
    if (s && !edited.required_skills.includes(s)) {
      setEdited((p) => ({ ...p, required_skills: [...p.required_skills, s] }));
    }
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setEdited((p) => ({ ...p, required_skills: p.required_skills.filter((s) => s !== skill) }));
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  }

  const domainOptions: JDCriteria["required_domain"][] = [
    "software", "product", "design", "data", "operations", "other",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm JD Criteria"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-strong)",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Step 1 of 2 &mdash; Confirm Parsed Criteria
            </span>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "none",
              border: "1px solid var(--border-strong)",
              borderRadius: "4px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "4px 10px",
              letterSpacing: "0.06em",
            }}
          >
            ESC
          </button>
        </div>

        {/* Body: two columns */}
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Left: raw JD */}
          <div
            style={{
              width: "40%",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Original JD
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
              }}
            >
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}
              >
                {rawJD}
              </pre>
            </div>
          </div>

          {/* Right: editable criteria */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Parsed Criteria &mdash; Edit as needed
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* role_title */}
              <FieldGroup label="Role Title">
                <input
                  type="text"
                  value={edited.role_title}
                  onChange={(e) => setEdited((p) => ({ ...p, role_title: e.target.value }))}
                  style={inputStyle}
                />
              </FieldGroup>

              {/* min_years_experience */}
              <FieldGroup label="Min. Years Experience">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={edited.min_years_experience}
                  onChange={(e) =>
                    setEdited((p) => {
                    const yrs = parseInt(e.target.value) || 0;
                    return { ...p, min_years_experience: yrs, experience_buckets_acceptable: syncBuckets(yrs) };
                  })
                  }
                  style={{ ...inputStyle, width: "100px" }}
                />
              </FieldGroup>

              {/* required_domain */}
              <FieldGroup label="Required Domain">
                <select
                  value={edited.required_domain}
                  onChange={(e) =>
                    setEdited((p) => ({ ...p, required_domain: e.target.value as JDCriteria["required_domain"] }))
                  }
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {domainOptions.map((d) => (
                    <option key={d} value={d} style={{ background: "#111", color: "#fff" }}>
                      {d}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              {/* required_skills */}
              <FieldGroup label="Required Skills">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {edited.required_skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "3px",
                        border: "1px solid var(--border-strong)",
                        background: "var(--bg-tertiary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 0,
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          lineHeight: 1,
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Add skill, press Enter"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={addSkill}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "7px 14px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      letterSpacing: "0.06em",
                    }}
                  >
                    + ADD
                  </button>
                </div>
              </FieldGroup>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <ToggleField
                  label="Technical Role"
                  checked={edited.is_technical_role}
                  onChange={(v) => setEdited((p) => ({ ...p, is_technical_role: v }))}
                />
                <ToggleField
                  label="Requires Work Experience"
                  checked={edited.requires_working_experience}
                  onChange={(v) => setEdited((p) => ({ ...p, requires_working_experience: v }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              padding: "8px 20px",
              borderRadius: "4px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(edited)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "8px 24px",
              borderRadius: "4px",
              border: "none",
              background: "var(--accent)",
              color: "#000",
              cursor: "pointer",
            }}
          >
            CONFIRM CRITERIA --&gt;
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "var(--text-primary)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-strong)",
  borderRadius: "4px",
  padding: "7px 12px",
  outline: "none",
  width: "100%",
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: "4px",
        border: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: "36px",
          height: "20px",
          borderRadius: "10px",
          border: "1px solid var(--border-strong)",
          background: checked ? "var(--accent)" : "var(--bg-tertiary)",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "17px" : "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: checked ? "#000" : "var(--text-muted)",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}
