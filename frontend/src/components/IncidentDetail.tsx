import { Incident, IncidentSummary } from "../services/api";
import SummaryPanel from "./SummaryPanel";

interface Props {
  incident: Incident;
  summary: IncidentSummary | null;
  summaryLoading: boolean;
  onClose: () => void;
  onSummarize: () => void;
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
  resolved: "#16a34a",
};

export default function IncidentDetail({
  incident,
  summary,
  summaryLoading,
  onClose,
  onSummarize,
}: Props) {
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

        {/* Summarize */}
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

        <SummaryPanel summary={summary} loading={summaryLoading} />
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
