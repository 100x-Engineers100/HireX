"use client";

import { useState, useEffect } from "react";
import { ScoringRubric, RubricDimension } from "@/types";

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
      prev.map((d, i) =>
        i === idx ? { ...d, anchors: { ...d.anchors, [field]: value } } : d
      )
    );
  }

  function handleApprove() {
    if (!weightOk) return;
    onApprove({ ...rubric, dimensions });
  }

  const weightColor = weightOk ? "var(--green)" : "var(--red, #e05252)";
  const weightBg = weightOk ? "var(--green-dim)" : "var(--red-dim, rgba(224,82,82,0.1))";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Approve Scoring Rubric"
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
          maxWidth: "700px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
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
                Step 2 of 2 &mdash; Scoring Rubric
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {rubric.generated_for}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginLeft: "18px",
              }}
            >
              Review and edit dimensions that will score all candidates
            </p>
          </div>

          {/* Weight total indicator */}
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: `1px solid ${weightColor}`,
              background: weightBg,
              flexShrink: 0,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                fontWeight: 700,
                color: weightColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {weightSum.toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: weightColor,
                textTransform: "uppercase",
              }}
            >
              {weightOk ? "[OK] total" : "[!] must = 1.0"}
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
            gap: "10px",
          }}
        >
          {dimensions.map((dim, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "var(--bg-secondary)",
                }}
              >
                {/* Dimension header row */}
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {/* Index badge */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--accent)",
                      width: "20px",
                      flexShrink: 0,
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
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      letterSpacing: "0.02em",
                    }}
                  />

                  {/* Weight input */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      weight
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
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "3px",
                        padding: "4px 8px",
                        outline: "none",
                        width: "70px",
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
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "3px 8px",
                      letterSpacing: "0.06em",
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? "^ anchors" : "v anchors"}
                  </button>
                </div>

                {/* Anchors (collapsible) */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {(
                      [
                        { field: "score_1" as const, label: "Score 1 - Poor" },
                        { field: "score_3" as const, label: "Score 3 - Average" },
                        { field: "score_5" as const, label: "Score 5 - Excellent" },
                      ] as const
                    ).map(({ field, label }) => (
                      <div key={field}>
                        <label
                          style={{
                            display: "block",
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "0.12em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            marginBottom: "5px",
                          }}
                        >
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
                            background: "var(--bg-panel)",
                            border: "1px solid var(--border-strong)",
                            borderRadius: "4px",
                            padding: "8px 10px",
                            outline: "none",
                            resize: "vertical",
                            lineHeight: 1.6,
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
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onBack}
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
            &lt;-- BACK
          </button>
          <button
            onClick={handleApprove}
            disabled={!weightOk}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "8px 24px",
              borderRadius: "4px",
              border: "none",
              background: weightOk ? "var(--accent)" : "var(--bg-tertiary)",
              color: weightOk ? "#000" : "var(--text-muted)",
              cursor: weightOk ? "pointer" : "not-allowed",
              transition: "background 0.15s ease",
            }}
          >
            APPROVE RUBRIC --&gt;
          </button>
        </div>
      </div>
    </div>
  );
}
