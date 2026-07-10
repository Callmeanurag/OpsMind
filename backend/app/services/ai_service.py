import json
import os

from app.models.incident import Incident

# Read once at startup. Defaults to mock mode if the variable is missing or unset.
USE_MOCK = os.getenv("USE_MOCK_AI", "true").lower() == "true"

# ── Summarize mock ────────────────────────────────────────────────────────────
MOCK_RESPONSE = {
    "summary": (
        "A service degradation was detected affecting end users. "
        "The incident was identified through monitoring alerts and triaged by the on-call engineer."
    ),
    "probable_cause": (
        "Likely caused by a recent deployment introducing a misconfiguration "
        "or unexpected load spike on a downstream dependency."
    ),
    "remediation": (
        "1. Roll back the most recent deployment if a code change is suspected.\n"
        "2. Check downstream service health and connection pool limits.\n"
        "3. Review recent configuration changes in the affected service.\n"
        "4. Confirm recovery by validating key health check endpoints."
    ),
}


def summarize_incident(incident: Incident) -> dict:
    """Entry point called by the route. Returns mock or real AI response."""
    if USE_MOCK:
        return MOCK_RESPONSE
    return _call_azure_openai(incident)


# ── Quick Fix mock ────────────────────────────────────────────────────────────
MOCK_QUICK_FIX = {
    "likely_issue": (
        "The service is likely experiencing connection pool exhaustion or a memory "
        "leak introduced by a recent deployment."
    ),
    "quick_fixes": [
        "Restart the affected pods to release leaked connections.",
        "Increase the database connection pool size if it is near the configured limit.",
        "Roll back the most recent deployment if the issue started after a release.",
        "Scale up the number of pod replicas temporarily to absorb the load spike.",
    ],
    "commands": [
        "kubectl rollout restart deployment/<service-name> -n opsmind-prod",
        "kubectl get pods -n opsmind-prod -w",
        "kubectl logs <pod-name> -n opsmind-prod --tail=100",
        "kubectl rollout undo deployment/<service-name> -n opsmind-prod",
    ],
    "verification_steps": [
        "Confirm all pods reach Running state after the restart.",
        "Check the error rate in Grafana — it should drop within 2-3 minutes.",
        "Validate the /health endpoint returns HTTP 200 OK.",
        "Monitor Log Analytics for any recurring errors over the next 10 minutes.",
    ],
    "escalate_to": (
        "Escalate to the Platform Engineering team if the issue persists after "
        "restarting pods and rolling back. Share kubectl logs output and the "
        "relevant Grafana dashboard panels."
    ),
}


def quick_fix_incident(incident: Incident) -> dict:
    """Returns actionable quick-fix guidance for an incident."""
    if USE_MOCK:
        return MOCK_QUICK_FIX
    return _call_azure_openai_quick_fix(incident)


def _call_azure_openai_quick_fix(incident: Incident) -> dict:
    """
    Calls Azure OpenAI to generate structured quick-fix guidance.
    Uses the same env vars as summarize: AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT.
    """
    from openai import AzureOpenAI

    client = AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version="2024-02-01",
    )

    prompt = f"""You are an on-call SRE assistant. Given the incident below, respond with a JSON object
containing exactly five keys:
- "likely_issue": one sentence diagnosing the most probable root cause
- "quick_fixes": a JSON array of 3-5 short actionable fix steps (each as a plain string)
- "commands": a JSON array of 3-5 terminal/kubectl commands to investigate or remediate (each as a plain string)
- "verification_steps": a JSON array of 3-5 steps to confirm the fix worked (each as a plain string)
- "escalate_to": one sentence on who to escalate to and what information to share if the fixes do not work

Incident:
  Title:       {incident.title}
  Description: {incident.description or "N/A"}
  Severity:    {incident.severity}
  Service:     {incident.service or "N/A"}
  Team:        {incident.team or "N/A"}
  RCA Notes:   {incident.rca_notes or "N/A"}
"""

    response = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)


def _call_azure_openai(incident: Incident) -> dict:
    """
    Calls Azure OpenAI to generate a structured incident summary.
    Requires three environment variables:
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT
    """
    from openai import AzureOpenAI

    client = AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version="2024-02-01",
    )

    prompt = f"""You are an SRE assistant. Analyze the incident below and respond with a JSON object
containing exactly three keys:
- "summary": one paragraph describing what happened in plain English
- "probable_cause": one or two sentences identifying the most likely root cause
- "remediation": a numbered list of steps to resolve or prevent recurrence

Incident:
  Title:               {incident.title}
  Description:         {incident.description or "N/A"}
  Severity:            {incident.severity}
  Service:             {incident.service or "N/A"}
  Team:                {incident.team or "N/A"}
  RCA Notes:           {incident.rca_notes or "N/A"}
  Remediation on file: {incident.remediation_steps or "N/A"}
"""

    response = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)
