import json
import os

from app.models.incident import Incident

# Read once at startup. Defaults to mock mode if the variable is missing or unset.
USE_MOCK = os.getenv("USE_MOCK_AI", "true").lower() == "true"

# Realistic mock response used in local development and demos
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
