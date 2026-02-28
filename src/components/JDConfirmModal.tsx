"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { JDCriteria } from "@/types";
import { SendIcon } from "@/components/ui/animated-state-icons";

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
  const BUCKET_MAX: Record<string, number> = { "<1": 1, "1-3": 3, "3-8": 8, "8-10": 10, ">10": 99 };

  function syncBuckets(min: number, max: number): string[] {
    return ALL_BUCKETS.filter((b) => {
      const bMin = BUCKET_MIN[b];
      const bMax = BUCKET_MAX[b];
      if (min > 0 && bMax < min) return false;
      if (max > 0 && bMin > max) return false;
      return true;
    });
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
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "rgba(13,13,13,0.95)",
          border: "1px solid rgba(249,104,70,0.15)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.7)",
          backgroundImage: "linear-gradient(to bottom, rgba(249,104,70,0.04) 0px, transparent 60px)",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Step pill */}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                padding: "3px 10px",
                borderRadius: "100px",
                background: "rgba(249,104,70,0.1)",
                border: "1px solid rgba(249,104,70,0.25)",
                color: "var(--accent)",
                textTransform: "uppercase",
              }}
            >
              Step 1 / 2
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              Confirm Parsed Criteria
            </span>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              padding: "5px 12px",
              transition: "border-color 0.15s ease, color 0.15s ease",
            }}
          >
            ESC
          </button>
        </div>

        {/* Body: two columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Left: raw JD */}
          <div
            style={{
              width: "38%",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-muted)" }} />
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
                original_jd.txt
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                {rawJD}
              </pre>
            </div>
          </div>

          {/* Right: editable criteria */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div
              style={{
                padding: "10px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "var(--accent)",
                  textTransform: "uppercase",
                }}
              >
                Parsed Criteria &mdash; edit as needed
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <FieldGroup label="Role Title">
                <input type="text" value={edited.role_title}
                  onChange={(e) => setEdited((p) => ({ ...p, role_title: e.target.value }))}
                  style={inputStyle}
                />
              </FieldGroup>

              <FieldGroup label="Experience Range (years)">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="number" min={0} max={20} value={edited.min_years_experience}
                    onChange={(e) => setEdited((p) => {
                      const min = parseInt(e.target.value) || 0;
                      return { ...p, min_years_experience: min, experience_buckets_acceptable: syncBuckets(min, p.max_years_experience) };
                    })}
                    style={{ ...inputStyle, width: "90px" }}
                    placeholder="Min"
                  />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>to</span>
                  <input
                    type="number" min={0} max={30} value={edited.max_years_experience}
                    onChange={(e) => setEdited((p) => {
                      const max = parseInt(e.target.value) || 0;
                      return { ...p, max_years_experience: max, experience_buckets_acceptable: syncBuckets(p.min_years_experience, max) };
                    })}
                    style={{ ...inputStyle, width: "90px" }}
                    placeholder="No cap (0)"
                  />
                  {edited.max_years_experience === 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>NO CAP</span>
                  )}
                </div>
              </FieldGroup>

              <FieldGroup label="Required Domain">
                <select
                  value={edited.required_domain}
                  onChange={(e) => setEdited((p) => ({ ...p, required_domain: e.target.value as JDCriteria["required_domain"] }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {domainOptions.map((d) => (
                    <option key={d} value={d} style={{ background: "#111", color: "#fff" }}>{d}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Required Skills">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {edited.required_skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(249,104,70,0.2)",
                        background: "rgba(249,104,70,0.07)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--accent)",
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
                          color: "rgba(249,104,70,0.5)",
                          padding: 0,
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          lineHeight: 1,
                          transition: "color 0.15s ease",
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
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "7px 16px",
                      borderRadius: "6px",
                      border: "1px solid rgba(249,104,70,0.25)",
                      background: "rgba(249,104,70,0.08)",
                      color: "var(--accent)",
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                      transition: "background 0.15s ease",
                    }}
                  >
                    + Add
                  </button>
                </div>
              </FieldGroup>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(edited)}
            className="shimmer-btn"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "9px 24px",
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
            Confirm Criteria
            <SendIcon size={14} color="#000" controlled={false} />
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
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "6px",
  padding: "8px 12px",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s ease",
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
          letterSpacing: "0.14em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "7px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleField({
  label, checked, onChange,
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
        padding: "11px 14px",
        borderRadius: "8px",
        border: checked ? "1px solid rgba(249,104,70,0.2)" : "1px solid rgba(255,255,255,0.06)",
        background: checked ? "rgba(249,104,70,0.05)" : "rgba(255,255,255,0.02)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "12px",
          fontWeight: 500,
          color: checked ? "var(--text-primary)" : "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: "38px",
          height: "22px",
          borderRadius: "11px",
          border: "none",
          background: checked ? "var(--accent)" : "rgba(255,255,255,0.1)",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s ease",
          flexShrink: 0,
          boxShadow: checked ? "0 0 10px rgba(249,104,70,0.3)" : "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "18px" : "3px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: checked ? "#000" : "var(--text-muted)",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}
