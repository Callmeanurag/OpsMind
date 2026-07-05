import { IncidentSummary } from "../services/api";

interface Props {
  summary: IncidentSummary | null;
  loading: boolean;
}

export default function SummaryPanel({ summary, loading }: Props) {
  if (!loading && !summary) return null;

  if (loading) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#0369a1", margin: 0, fontSize: 14 }}>
          Generating AI summary...
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700, color: "#0369a1", marginBottom: "0.75rem", fontSize: 14 }}>
        AI Incident Summary
      </div>
      {[
        { label: "Summary",              value: summary!.summary },
        { label: "Probable Cause",       value: summary!.probable_cause },
        { label: "Suggested Remediation",value: summary!.remediation },
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#0369a1",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 14, color: "#1e3a5f", whiteSpace: "pre-wrap" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: 8,
  padding: "1rem",
  marginTop: "1rem",
};
