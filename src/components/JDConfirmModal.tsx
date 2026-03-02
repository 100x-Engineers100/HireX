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
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "rgba(10,10,10,0.4)",
          border: "1px solid var(--border-strong)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          backdropFilter: "blur(32px) saturate(140%)",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Step pill */}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                padding: "4px 12px",
                borderRadius: "6px",
                background: "rgba(249,104,70,0.06)",
                border: "1px solid rgba(249,104,70,0.25)",
                color: "var(--accent)",
                textTransform: "uppercase",
              }}
            >
              PHASE 01/02
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              Confirm Extraction
            </span>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              padding: "6px 14px",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--text-muted)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          >
            DISMISS
          </button>
        </div>

        {/* Body: two columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Left: raw JD */}
          <div
            style={{
              width: "36%",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", opacity: 0.5 }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                RAW_SOURCE.TXT
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "rgba(0,0,0,0.1)" }}>
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  opacity: 0.8,
                  letterSpacing: "0.01em"
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
                padding: "12px 24px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                }}
              >
                MANUAL_VERIFICATION
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <FieldGroup label="Role Identity">
                <input type="text" value={edited.role_title}
                  onChange={(e) => setEdited((p) => ({ ...p, role_title: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. Senior Software Engineer"
                />
              </FieldGroup>

              <FieldGroup label="Experience Threshold">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="number" min={0} max={20} value={edited.min_years_experience}
                      onChange={(e) => setEdited((p) => {
                        const min = parseInt(e.target.value) || 0;
                        return { ...p, min_years_experience: min, experience_buckets_acceptable: syncBuckets(min, p.max_years_experience) };
                      })}
                      style={{ ...inputStyle, paddingLeft: "32px" }}
                    />
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>MIN</span>
                  </div>
                  <div style={{ width: "8px", height: "1px", background: "var(--border-strong)" }} />
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="number" min={0} max={30} value={edited.max_years_experience}
                      onChange={(e) => setEdited((p) => {
                        const max = parseInt(e.target.value) || 0;
                        return { ...p, max_years_experience: max, experience_buckets_acceptable: syncBuckets(p.min_years_experience, max) };
                      })}
                      style={{ ...inputStyle, paddingLeft: "32px" }}
                    />
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>MAX</span>
                  </div>
                  {edited.max_years_experience === 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em" }}>UNLIMITED</span>
                  )}
                </div>
              </FieldGroup>

              <FieldGroup label="Domain Sector">
                <select
                  value={edited.required_domain}
                  onChange={(e) => setEdited((p) => ({ ...p, required_domain: e.target.value as JDCriteria["required_domain"] }))}
                  style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
                >
                  {domainOptions.map((d) => (
                    <option key={d} value={d} style={{ background: "#111", color: "#fff" }}>{d.toUpperCase()}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Skill requirements">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {edited.required_skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(249,104,70,0.2)",
                        background: "rgba(249,104,70,0.06)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--accent)",
                        transition: "all 0.2s ease",
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
                          color: "rgba(249,104,70,0.4)",
                          padding: 0,
                          fontFamily: "var(--font-mono)",
                          fontSize: "14px",
                          lineHeight: 1,
                          marginTop: "-1px"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "var(--accent)")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "rgba(249,104,70,0.4)")}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Type skill & press Enter"
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
                      fontWeight: 800,
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "1px solid rgba(249,104,70,0.3)",
                      background: "rgba(249,104,70,0.08)",
                      color: "var(--accent)",
                      cursor: "pointer",
                      letterSpacing: "0.06em",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(249,104,70,0.15)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "rgba(249,104,70,0.08)")}
                  >
                    APPEND
                  </button>
                </div>
              </FieldGroup>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <ToggleField
                  label="Is this a technical/engineering role?"
                  checked={edited.is_technical_role}
                  onChange={(v) => setEdited((p) => ({ ...p, is_technical_role: v }))}
                />
                <ToggleField
                  label="Does it require prior work experience?"
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
            padding: "20px 28px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "10px 22px",
              borderRadius: "10px",
              border: "1px solid var(--border-strong)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            DISCARD
          </button>
          <button
            onClick={() => onConfirm(edited)}
            className="shimmer-btn"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "11px 28px",
              borderRadius: "10px",
              border: "none",
              background: "var(--accent)",
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(249,104,70,0.3)"
            }}
          >
            CONFIRM & CONTINUE
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
  fontWeight: 500,
  color: "var(--text-primary)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border-strong)",
  borderRadius: "8px",
  padding: "10px 14px",
  outline: "none",
  width: "100%",
  transition: "all 0.2s ease",
  caretColor: "var(--accent)"
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.2em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "10px",
          opacity: 0.8
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
        padding: "12px 16px",
        borderRadius: "10px",
        border: checked ? "1px solid rgba(249,104,70,0.25)" : "1px solid var(--border)",
        background: checked ? "rgba(249,104,70,0.06)" : "rgba(255,255,255,0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "13px",
          fontWeight: 600,
          color: checked ? "var(--text-primary)" : "var(--text-secondary)",
          opacity: checked ? 1 : 0.7
        }}
      >
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "100px",
          border: "none",
          background: checked ? "var(--accent)" : "rgba(255,255,255,0.1)",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.3s ease",
          flexShrink: 0,
          boxShadow: checked ? "0 0 12px rgba(249,104,70,0.25)" : "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: checked ? "#000" : "var(--text-muted)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        />
      </button>
    </div>
  );
}
