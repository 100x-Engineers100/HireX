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
          maxWidth: "720px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.7)",
          backgroundImage: "linear-gradient(to bottom, rgba(249,104,70,0.04) 0px, transparent 60px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
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
                flexShrink: 0,
              }}
            >
              Step 2 / 2
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                  }}
                >
                  Scoring Rubric
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--accent)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rubric.generated_for}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                  marginTop: "2px",
                }}
              >
                Review and edit dimensions. Weights must sum to 1.00.
              </p>
            </div>
          </div>

          {/* Weight indicator */}
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: `1px solid ${weightBorder}`,
              background: weightBg,
              flexShrink: 0,
              textAlign: "center",
              minWidth: "80px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
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
                letterSpacing: "0.1em",
                color: weightColor,
                textTransform: "uppercase",
                marginTop: "3px",
                opacity: 0.8,
              }}
            >
              {weightOk ? "total [OK]" : "must = 1.00"}
            </div>
          </div>
        </div>

        {/* Dimensions list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {dimensions.map((dim, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  border: isOpen ? "1px solid rgba(249,104,70,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: isOpen ? "rgba(249,104,70,0.03)" : "rgba(255,255,255,0.02)",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
              >
                {/* Dimension header row */}
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {/* Index badge */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      width: "22px",
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Name input */}
                  <input
                    type="text"
                    value={dim.name}
                    onChange={(e) => updateDimension(idx, { name: e.target.value })}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-display)",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                    }}
                  />

                  {/* Weight input */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "8px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    >
                      wt
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
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "5px",
                        padding: "4px 8px",
                        outline: "none",
                        width: "68px",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    />
                  </div>

                  {/* Toggle anchors */}
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    style={{
                      background: isOpen ? "rgba(249,104,70,0.1)" : "rgba(255,255,255,0.04)",
                      border: isOpen ? "1px solid rgba(249,104,70,0.2)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "6px",
                      color: isOpen ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                      textTransform: "uppercase",
                    }}
                  >
                    {isOpen ? "^ anchors" : "v anchors"}
                  </button>
                </div>

                {/* Anchors (collapsible) */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {(
                      [
                        { field: "score_1" as const, label: "Score 1 — Poor", color: "var(--red)" },
                        { field: "score_3" as const, label: "Score 3 — Average", color: "var(--yellow)" },
                        { field: "score_5" as const, label: "Score 5 — Excellent", color: "var(--green)" },
                      ] as const
                    ).map(({ field, label, color }) => (
                      <div key={field}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            color,
                            textTransform: "uppercase",
                            marginBottom: "6px",
                            opacity: 0.8,
                          }}
                        >
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
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
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            outline: "none",
                            resize: "vertical",
                            lineHeight: 1.65,
                          }}
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
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <button
            onClick={onBack}
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Left-pointing chevron SVG */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <button
            onClick={handleApprove}
            disabled={!weightOk}
            className={weightOk ? "shimmer-btn" : ""}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "9px 24px",
              borderRadius: "8px",
              border: "none",
              background: weightOk ? "var(--accent)" : "rgba(255,255,255,0.05)",
              color: weightOk ? "#000" : "var(--text-muted)",
              cursor: weightOk ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Approve Rubric
            <SendIcon size={14} color={weightOk ? "#000" : "var(--text-muted)"} controlled={false} />
          </button>
        </div>
      </div>
    </div>
  );
}
