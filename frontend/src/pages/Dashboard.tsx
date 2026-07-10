import { useState, useEffect } from "react";
import { api, Incident, IncidentSummary, IncidentCreate, QuickFixResponse, CloseIncidentPayload } from "../services/api";
import SearchBar from "../components/SearchBar";
import IncidentCard from "../components/IncidentCard";
import IncidentDetail from "../components/IncidentDetail";

const SEVERITIES = ["low", "medium", "high", "critical"];

const EMPTY_FORM: IncidentCreate = {
  title: "",
  description: "",
  severity: "medium",
  service: "",
  team: "",
};

const EMPTY_CLOSE_FORM: CloseIncidentPayload = {
  resolution_summary: "",
  rca_notes: "",
  remediation_steps: "",
  preventive_actions: "",
  resolved_by: "",
  closure_comment: "",
};

export default function Dashboard() {
  const [incidents, setIncidents]                   = useState<Incident[]>([]);
  const [selected, setSelected]                     = useState<Incident | null>(null);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState<string | null>(null);
  const [summary, setSummary]                       = useState<IncidentSummary | null>(null);
  const [summaryLoading, setSummaryLoading]         = useState(false);
  const [quickFix, setQuickFix]                     = useState<QuickFixResponse | null>(null);
  const [quickFixLoading, setQuickFixLoading]       = useState(false);
  const [showForm, setShowForm]                     = useState(false);
  const [form, setForm]                             = useState<IncidentCreate>(EMPTY_FORM);
  const [formError, setFormError]                   = useState<string | null>(null);
  const [acknowledgeLoading, setAcknowledgeLoading] = useState(false);
  const [showCloseForm, setShowCloseForm]           = useState(false);
  const [closeForm, setCloseForm]                   = useState<CloseIncidentPayload>(EMPTY_CLOSE_FORM);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIncidents();
      setIncidents(data);
    } catch {
      setError("Failed to load incidents. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    // Empty query means the user cleared the search — reload the full list
    if (!q) {
      loadIncidents();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchIncidents(q);
      setIncidents(data);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createIncident(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadIncidents();
    } catch {
      setFormError("Failed to create incident. Please try again.");
    }
  }

  async function handleSummarize() {
    if (!selected) return;
    setSummaryLoading(true);
    try {
      const result = await api.summarizeIncident(selected.id);
      setSummary(result);
    } catch {
      setSummary({
        summary: "Failed to generate summary.",
        probable_cause: "—",
        remediation: "—",
      });
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleQuickFix() {
    if (!selected) return;
    setQuickFixLoading(true);
    try {
      const result = await api.quickFixIncident(selected.id);
      setQuickFix(result);
    } catch {
      setQuickFix({
        likely_issue: "Failed to generate quick fix suggestions.",
        quick_fixes: [],
        commands: [],
        verification_steps: [],
        escalate_to: "—",
      });
    } finally {
      setQuickFixLoading(false);
    }
  }

  async function handleAcknowledge() {
    if (!selected) return;
    setAcknowledgeLoading(true);
    try {
      const updated = await api.acknowledgeIncident(selected.id);
      setSelected(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      // button remains clickable; no partial state to roll back
    } finally {
      setAcknowledgeLoading(false);
    }
  }

  async function handleCloseIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      const updated = await api.closeIncident(selected.id, closeForm);
      setSelected(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setShowCloseForm(false);
    } catch {
      // silently ignore; form stays open so user can retry
    }
  }

  function handleOpenModal(incident: Incident) {
    setSelected(incident);
    setSummary(null);
    setSummaryLoading(false);
    setQuickFix(null);
    setQuickFixLoading(false);
    setShowCloseForm(false);
    setCloseForm({
      resolution_summary: incident.resolution_summary ?? "",
      rca_notes: incident.rca_notes ?? "",
      remediation_steps: incident.remediation_steps ?? "",
      preventive_actions: incident.preventive_actions ?? "",
      resolved_by: incident.resolved_by ?? "",
      closure_comment: incident.closure_comment ?? "",
    });
    setAcknowledgeLoading(false);
  }

  function handleCloseModal() {
    setSelected(null);
    setSummary(null);
    setSummaryLoading(false);
    setQuickFix(null);
    setQuickFixLoading(false);
    setShowCloseForm(false);
    setCloseForm(EMPTY_CLOSE_FORM);
    setAcknowledgeLoading(false);
  }

  const openCount         = incidents.filter((i) => i.status === "open").length;
  const acknowledgedCount = incidents.filter((i) => i.status === "acknowledged").length;
  const resolvedCount     = incidents.filter((i) => i.status === "resolved").length;
  const closedCount       = incidents.filter((i) => i.status === "closed").length;

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 1rem",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a", fontWeight: 700 }}>OpsMind</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          AI Incident Intelligence Platform
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Total",        value: incidents.length,  color: "#334155" },
          { label: "Open",         value: openCount,          color: "#dc2626" },
          { label: "Acknowledged", value: acknowledgedCount,  color: "#d97706" },
          { label: "Resolved",     value: resolvedCount,      color: "#16a34a" },
          { label: "Closed",       value: closedCount,        color: "#6366f1" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Report button */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <SearchBar onSearch={handleSearch} />
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          style={{
            background: showForm ? "#64748b" : "#2563eb",
            color: "#fff",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {showForm ? "Cancel" : "+ Report Incident"}
        </button>
      </div>

      {/* Create incident form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: 16, color: "#0f172a" }}>
            Report New Incident
          </h3>

          <input
            required
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={fieldStyle}
          />
          <textarea
            required
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...fieldStyle, height: 72, resize: "vertical" }}
          />
          <input
            required
            placeholder="Service *"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            style={fieldStyle}
          />
          <input
            required
            placeholder="Team *"
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value })}
            style={fieldStyle}
          />
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            style={fieldStyle}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {formError && (
            <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 0.75rem" }}>{formError}</p>
          )}

          <button
            type="submit"
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Submit
          </button>
        </form>
      )}

      {/* States */}
      {loading && <p style={{ color: "#64748b" }}>Loading incidents...</p>}
      {error   && <p style={{ color: "#dc2626" }}>{error}</p>}
      {!loading && !error && incidents.length === 0 && (
        <p style={{ color: "#64748b" }}>No incidents found. Create one to get started.</p>
      )}

      {/* Incident list */}
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} onClick={handleOpenModal} />
      ))}

      {/* Detail modal */}
      {selected && (
        <IncidentDetail
          incident={selected}
          summary={summary}
          summaryLoading={summaryLoading}
          onClose={handleCloseModal}
          onSummarize={handleSummarize}
          quickFix={quickFix}
          quickFixLoading={quickFixLoading}
          onQuickFix={handleQuickFix}
          acknowledgeLoading={acknowledgeLoading}
          onAcknowledge={handleAcknowledge}
          showCloseForm={showCloseForm}
          onToggleCloseForm={() => setShowCloseForm((v) => !v)}
          closeForm={closeForm}
          onCloseFormChange={(field, value) =>
            setCloseForm((prev) => ({ ...prev, [field]: value }))
          }
          onCloseIncident={handleCloseIncident}
        />
      )}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem 0.75rem",
  marginBottom: "0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};
