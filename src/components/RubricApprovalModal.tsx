"use client";

import { useState, useEffect } from "react";
import { ScoringRubric, RubricDimension } from "@/types";
import { SendIcon } from "@/components/ui/animated-state-icons";

interface RubricApprovalModalProps {
  rubric: ScoringRubric;
  onApprove: (edited: ScoringRubric) => void;
  onBack: () => void;
}

export default function RubricApprovalModal({ rubric, onApprove, onBack }: RubricApprovalModalProps) {
  const [dimensions, setDimensions] = useState<RubricDimension[]>(
    rubric.dimensions.map((d) => ({ ...d, anchors: { ...d.anchors } }))
  );
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const weightSum = dimensions.reduce((acc, d) => acc + d.weight, 0);
  const weightOk = Math.abs(weightSum - 1.0) <= 0.01;

  function updateDimension(idx: number, patch: Partial<RubricDimension>) {
    setDimensions((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function updateAnchor(idx: number, field: keyof RubricDimension["anchors"], value: string) {
    setDimensions((prev) =>
      prev.map((d, i) => i === idx ? { ...d, anchors: { ...d.anchors, [field]: value } } : d)
    );
  }

  function handleApprove() {
    if (!weightOk) return;
    onApprove({ ...rubric, dimensions });
  }

  const weightColor = weightOk ? "var(--green)" : "var(--red, #e05252)";
  const weightBg = weightOk ? "rgba(61,204,122,0.08)" : "rgba(224,82,82,0.08)";
  const weightBorder = weightOk ? "rgba(61,204,122,0.25)" : "rgba(224,82,82,0.25)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Approve Scoring Rubric"
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
          maxWidth: "760px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          backdropFilter: "blur(32px) saturate(140%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "20px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
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
                flexShrink: 0,
              }}
            >
              PHASE 02/02
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--text-primary)",
                  }}
                >
                  Scoring Rubric
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--accent)",
                    opacity: 0.8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rubric.generated_for.toUpperCase()}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                  marginTop: "3px",
                  opacity: 0.7,
                  letterSpacing: "0.01em"
                }}
              >
                Define evaluation weights. Total sum must equal 1.00.
              </p>
            </div>
          </div>

          {/* Weight indicator */}
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: `1px solid ${weightBorder}`,
              background: weightBg,
              flexShrink: 0,
              textAlign: "center",
              minWidth: "90px",
              boxShadow: weightOk ? "0 0 20px rgba(61,204,122,0.1)" : "none",
              transition: "all 0.3s ease"
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: weightColor,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {weightSum.toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                color: weightColor,
                textTransform: "uppercase",
                marginTop: "4px",
                opacity: 0.9,
              }}
            >
              {weightOk ? "VALID" : "INVALID"}
            </div>
          </div>
        </div>

        {/* Dimensions list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {dimensions.map((dim, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  border: isOpen ? "1px solid rgba(249,104,70,0.3)" : "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: isOpen ? "rgba(249,104,70,0.04)" : "rgba(255,255,255,0.015)",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Dimension header row */}
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  {/* Index badge */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--accent)",
                      width: "24px",
                      flexShrink: 0,
                      opacity: 0.6,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Name input */}
                  <input
                    type="text"
                    value={dim.name}
                    onChange={(e) => updateDimension(idx, { name: e.target.value })}
                    placeholder="Dimension Name"
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-display)",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      caretColor: "var(--accent)"
                    }}
                  />

                  {/* Weight input */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        opacity: 0.6
                      }}
                    >
                      WEIGHT
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={dim.weight}
                      onChange={(e) => updateDimension(idx, { weight: parseFloat(e.target.value) || 0 })}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "7px",
                        padding: "5px 10px",
                        outline: "none",
                        width: "72px",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                        transition: "border-color 0.2s ease"
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                  </div>

                  {/* Toggle anchors */}
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    style={{
                      background: isOpen ? "rgba(249,104,70,0.12)" : "rgba(255,255,255,0.04)",
                      border: isOpen ? "1px solid rgba(249,104,70,0.3)" : "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      color: isOpen ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "6px 14px",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                      textTransform: "uppercase",
                    }}
                    onMouseOver={(e) => !isOpen && (e.currentTarget.style.borderColor = "var(--text-muted)")}
                    onMouseOut={(e) => !isOpen && (e.currentTarget.style.borderColor = "var(--border-strong)")}
                  >
                    {isOpen ? "HIDE" : "DETAILS"}
                  </button>
                </div>

                {/* Anchors (collapsible) */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      background: "rgba(0,0,0,0.15)",
                    }}
                  >
                    {(
                      [
                        { field: "score_1" as const, label: "Threshold 1.0 — Below Standard", color: "var(--red)" },
                        { field: "score_3" as const, label: "Threshold 3.0 — Competent", color: "var(--yellow)" },
                        { field: "score_5" as const, label: "Threshold 5.0 — Outstanding", color: "var(--green)" },
                      ] as const
                    ).map(({ field, label, color }) => (
                      <div key={field}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 800,
                            letterSpacing: "0.15em",
                            color,
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0, boxShadow: `0 0 8px ${color}` }} />
                          {label}
                        </label>
                        <textarea
                          value={dim.anchors[field]}
                          onChange={(e) => updateAnchor(idx, field, e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border-strong)",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            outline: "none",
                            resize: "none",
                            lineHeight: 1.7,
                            transition: "border-color 0.2s ease"
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = color)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 28px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "10px 22px",
              borderRadius: "10px",
              border: "1px solid var(--border-strong)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            PREVIOUS
          </button>
          <button
            onClick={handleApprove}
            disabled={!weightOk}
            className={weightOk ? "shimmer-btn" : ""}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "11px 28px",
              borderRadius: "10px",
              border: "none",
              background: weightOk ? "var(--accent)" : "rgba(255,255,255,0.03)",
              color: weightOk ? "#000" : "var(--text-muted)",
              cursor: weightOk ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: weightOk ? "0 4px 16px rgba(249,104,70,0.3)" : "none",
              transition: "all 0.3s ease",
              opacity: weightOk ? 1 : 0.6
            }}
          >
            INITIALIZE ENGINE
            <SendIcon size={14} color={weightOk ? "#000" : "var(--text-muted)"} controlled={false} />
          </button>
        </div>
      </div>
    </div>
  );
}
