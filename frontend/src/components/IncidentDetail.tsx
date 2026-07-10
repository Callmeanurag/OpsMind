import { CloseIncidentPayload, Incident, IncidentSummary, QuickFixResponse } from "../services/api";
import SummaryPanel from "./SummaryPanel";

interface Props {
  incident: Incident;
  summary: IncidentSummary | null;
  summaryLoading: boolean;
  onClose: () => void;
  onSummarize: () => void;
  quickFix: QuickFixResponse | null;
  quickFixLoading: boolean;
  onQuickFix: () => void;
  acknowledgeLoading: boolean;
  onAcknowledge: () => void;
  showCloseForm: boolean;
  onToggleCloseForm: () => void;
  closeForm: CloseIncidentPayload;
  onCloseFormChange: (field: keyof CloseIncidentPayload, value: string) => void;
  onCloseIncident: (e: React.FormEvent) => void;
}

const SEVERITY_COLOR: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
  critical: "#7c3aed",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#dc2626",
  investigating: "#d97706",
  acknowledged: "#d97706",
  resolved: "#16a34a",
  closed: "#6366f1",
};

export default function IncidentDetail({
  incident,
  summary,
  summaryLoading,
  onClose,
  onSummarize,
  quickFix,
  quickFixLoading,
  onQuickFix,
  acknowledgeLoading,
  onAcknowledge,
  showCloseForm,
  onToggleCloseForm,
  closeForm,
  onCloseFormChange,
  onCloseIncident,
}: Props) {
  const canAcknowledge = incident.status === "open";
  const canClose       = incident.status !== "closed";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 100,
        padding: "2rem 1rem",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "2rem",
          width: "100%",
          maxWidth: 640,
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#64748b",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Title */}
        <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, color: "#0f172a", paddingRight: 32 }}>
          {incident.title}
        </h2>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <Badge text={incident.severity} color={SEVERITY_COLOR[incident.severity] ?? "#64748b"} />
          <Badge text={incident.status}   color={STATUS_COLOR[incident.status] ?? "#64748b"} />
          {incident.service && <Badge text={`Service: ${incident.service}`} color="#475569" />}
          {incident.team    && <Badge text={`Team: ${incident.team}`}    color="#475569" />}
        </div>

        {/* Fields */}
        <Field label="Description"           value={incident.description} />
        <Field label="Root Cause Analysis"   value={incident.rca_notes} />
        <Field label="Remediation Steps"     value={incident.remediation_steps} />

        {/* Timestamp */}
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: "1.25rem" }}>
          Created: {new Date(incident.created_at).toLocaleString()}
        </div>

        {/* Lifecycle section — shown only once data exists */}
        {(incident.acknowledged_at || incident.closed_at || incident.tta_minutes != null || incident.tte_minutes != null) && (
          <LifecycleSection incident={incident} />
        )}

        {/* Closure detail fields — shown only once populated */}
        <Field label="Resolution Summary"  value={incident.resolution_summary ?? null} />
        <Field label="Preventive Actions"  value={incident.preventive_actions ?? null} />
        <Field label="Resolved By"         value={incident.resolved_by ?? null} />
        <Field label="Closure Comment"     value={incident.closure_comment ?? null} />

        {/* Lifecycle action buttons */}
        {(canAcknowledge || canClose) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {canAcknowledge && (
              <button
                onClick={onAcknowledge}
                disabled={acknowledgeLoading}
                style={{
                  background: acknowledgeLoading ? "#94a3b8" : "#d97706",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  borderRadius: 6,
                  cursor: acknowledgeLoading ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                {acknowledgeLoading ? "Acknowledging..." : "Acknowledge Incident"}
              </button>
            )}
            {canClose && (
              <button
                onClick={onToggleCloseForm}
                style={{
                  background: showCloseForm ? "#64748b" : "#6366f1",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {showCloseForm ? "Cancel" : "Close Incident"}
              </button>
            )}
          </div>
        )}

        {/* Inline close form */}
        {showCloseForm && (
          <form
            onSubmit={onCloseIncident}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: "0.75rem" }}>
              Close Incident
            </div>
            <input
              placeholder="Resolved By (name or team, optional)"
              value={closeForm.resolved_by ?? ""}
              onChange={(e) => onCloseFormChange("resolved_by", e.target.value)}
              style={closeFieldStyle}
            />
            <textarea
              placeholder="Resolution Summary (optional)"
              value={closeForm.resolution_summary ?? ""}
              onChange={(e) => onCloseFormChange("resolution_summary", e.target.value)}
              style={{ ...closeFieldStyle, height: 60, resize: "vertical" }}
            />
            <textarea
              placeholder="Root Cause Analysis (optional)"
              value={closeForm.rca_notes ?? ""}
              onChange={(e) => onCloseFormChange("rca_notes", e.target.value)}
              style={{ ...closeFieldStyle, height: 60, resize: "vertical" }}
            />
            <textarea
              placeholder="Remediation Steps (optional)"
              value={closeForm.remediation_steps ?? ""}
              onChange={(e) => onCloseFormChange("remediation_steps", e.target.value)}
              style={{ ...closeFieldStyle, height: 60, resize: "vertical" }}
            />
            <textarea
              placeholder="Preventive Actions (optional)"
              value={closeForm.preventive_actions ?? ""}
              onChange={(e) => onCloseFormChange("preventive_actions", e.target.value)}
              style={{ ...closeFieldStyle, height: 60, resize: "vertical" }}
            />
            <textarea
              placeholder="Closure Comment (optional)"
              value={closeForm.closure_comment ?? ""}
              onChange={(e) => onCloseFormChange("closure_comment", e.target.value)}
              style={{ ...closeFieldStyle, height: 60, resize: "vertical" }}
            />
            <button
              type="submit"
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Confirm Close
            </button>
          </form>
        )}

        {/* AI action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={onSummarize}
            disabled={summaryLoading}
            style={{
              background: summaryLoading ? "#94a3b8" : "#2563eb",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: 6,
              cursor: summaryLoading ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {summaryLoading ? "Analyzing..." : "Summarize with AI"}
          </button>

          <button
            onClick={onQuickFix}
            disabled={quickFixLoading}
            style={{
              background: quickFixLoading ? "#94a3b8" : "#16a34a",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: 6,
              cursor: quickFixLoading ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {quickFixLoading ? "Generating..." : "Quick Fix with AI"}
          </button>
        </div>

        <SummaryPanel summary={summary} loading={summaryLoading} />
        <QuickFixPanel quickFix={quickFix} loading={quickFixLoading} />
      </div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        background: color + "18",
        color,
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
      }}
    >
      {text}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#1e293b", whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

function LifecycleSection({ incident }: { incident: Incident }) {
  return (
    <div
      style={{
        marginBottom: "1.25rem",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.6rem",
        }}
      >
        Lifecycle
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 2rem" }}>
        {incident.acknowledged_at && (
          <LifecycleItem label="Acknowledged At" value={new Date(incident.acknowledged_at).toLocaleString()} />
        )}
        {incident.tta_minutes != null && (
          <LifecycleItem label="Time to Acknowledge" value={`${incident.tta_minutes} min`} />
        )}
        {incident.resolved_at && (
          <LifecycleItem label="Resolved At" value={new Date(incident.resolved_at).toLocaleString()} />
        )}
        {incident.closed_at && (
          <LifecycleItem label="Closed At" value={new Date(incident.closed_at).toLocaleString()} />
        )}
        {incident.tte_minutes != null && (
          <LifecycleItem label="Time to Close" value={`${incident.tte_minutes} min`} />
        )}
      </div>
    </div>
  );
}

function LifecycleItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#334155" }}>{value}</div>
    </div>
  );
}

// ── QuickFixPanel ─────────────────────────────────────────────────────────────

function QuickFixPanel({
  quickFix,
  loading,
}: {
  quickFix: QuickFixResponse | null;
  loading: boolean;
}) {
  if (!loading && !quickFix) return null;

  return (
    <div
      style={{
        marginTop: "1.5rem",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 8,
        padding: "1.25rem",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, color: "#15803d", marginBottom: "0.75rem" }}>
        AI Quick Fix Suggestions
      </div>

      {loading && (
        <p style={{ fontSize: 14, color: "#64748b" }}>Generating quick fix guidance...</p>
      )}

      {quickFix && (
        <>
          <QuickFixSection label="Likely Issue">
            <p style={{ margin: 0, fontSize: 14, color: "#1e293b" }}>{quickFix.likely_issue}</p>
          </QuickFixSection>

          <QuickFixSection label="Suggested Quick Fixes">
            <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {quickFix.quick_fixes.map((fix, i) => (
                <li key={i} style={{ fontSize: 14, color: "#1e293b", marginBottom: 4 }}>{fix}</li>
              ))}
            </ol>
          </QuickFixSection>

          <QuickFixSection label="Commands to Try">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {quickFix.commands.map((cmd, i) => (
                <code
                  key={i}
                  style={{
                    display: "block",
                    background: "#0f172a",
                    color: "#86efac",
                    padding: "0.35rem 0.6rem",
                    borderRadius: 4,
                    fontSize: 12.5,
                    fontFamily: "Consolas, monospace",
                    overflowX: "auto",
                  }}
                >
                  {cmd}
                </code>
              ))}
            </div>
          </QuickFixSection>

          <QuickFixSection label="Verification Steps">
            <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {quickFix.verification_steps.map((step, i) => (
                <li key={i} style={{ fontSize: 14, color: "#1e293b", marginBottom: 4 }}>{step}</li>
              ))}
            </ol>
          </QuickFixSection>

          <QuickFixSection label="Escalation Advice">
            <p style={{ margin: 0, fontSize: 14, color: "#1e293b" }}>{quickFix.escalate_to}</p>
          </QuickFixSection>

          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem 0.75rem",
              background: "#fef9c3",
              border: "1px solid #fde047",
              borderRadius: 6,
              fontSize: 12,
              color: "#713f12",
            }}
          >
            AI suggestions are advisory only. Validate before applying changes in production.
          </div>
        </>
      )}
    </div>
  );
}

function QuickFixSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#15803d",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const closeFieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem 0.75rem",
  marginBottom: "0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
  fontFamily: "inherit",
};
