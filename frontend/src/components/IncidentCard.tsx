import { Incident } from "../services/api";

interface Props {
  incident: Incident;
  onClick: (incident: Incident) => void;
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

export default function IncidentCard({ incident, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(incident)}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "1rem 1.25rem",
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4, fontSize: 15 }}>
            {incident.title}
          </div>
          {incident.description && (
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              {incident.description.length > 120
                ? incident.description.slice(0, 120) + "…"
                : incident.description}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge text={incident.severity} color={SEVERITY_COLOR[incident.severity] ?? "#64748b"} />
            <Badge text={incident.status} color={STATUS_COLOR[incident.status] ?? "#64748b"} />
            {incident.service && <Badge text={incident.service} color="#475569" />}
            {incident.team && <Badge text={incident.team} color="#475569" />}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginLeft: 12, whiteSpace: "nowrap" }}>
          {new Date(incident.created_at).toLocaleDateString()}
        </div>
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
