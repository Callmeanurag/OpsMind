// All backend calls go through this file.
// Change API_BASE_URL here if your backend runs on a different port.
const API_BASE_URL = "http://localhost:8000";

export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  service: string;
  team: string;
  rca_notes: string;
  remediation_steps: string;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  resolution_summary?: string | null;
  preventive_actions?: string | null;
  resolved_by?: string | null;
  closure_comment?: string | null;
  tta_minutes?: number | null;
  tte_minutes?: number | null;
}

export interface IncidentSummary {
  summary: string;
  probable_cause: string;
  remediation: string;
}

export interface QuickFixResponse {
  likely_issue: string;
  quick_fixes: string[];
  commands: string[];
  verification_steps: string[];
  escalate_to: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  severity: string;
  service: string;
  team: string;
}

export interface CloseIncidentPayload {
  resolution_summary?: string;
  rca_notes?: string;
  remediation_steps?: string;
  preventive_actions?: string;
  resolved_by?: string;
  closure_comment?: string;
}

// Generic fetch wrapper — throws on non-2xx responses
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  listIncidents: () =>
    request<Incident[]>("/api/incidents/"),

  getIncident: (id: number) =>
    request<Incident>(`/api/incidents/${id}`),

  createIncident: (data: IncidentCreate) =>
    request<Incident>("/api/incidents/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  searchIncidents: (q: string) =>
    request<Incident[]>(`/api/search/?q=${encodeURIComponent(q)}`),

  summarizeIncident: (incident_id: number) =>
    request<IncidentSummary>("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ incident_id }),
    }),

  quickFixIncident: (incident_id: number) =>
    request<QuickFixResponse>("/api/ai/quick-fix", {
      method: "POST",
      body: JSON.stringify({ incident_id }),
    }),

  acknowledgeIncident: (id: number) =>
    request<Incident>(`/api/incidents/${id}/acknowledge`, {
      method: "PATCH",
    }),

  closeIncident: (id: number, payload: CloseIncidentPayload) =>
    request<Incident>(`/api/incidents/${id}/close`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
