# OpsMind
### AI-Assisted Incident Intelligence Platform for DevOps and SRE Teams

---

## Overview

OpsMind is a web application that helps engineers investigate production incidents faster.

When something breaks in production, engineers waste time searching across Slack, wikis, and runbooks to find context — what broke before, who owns the service, what was tried last time. OpsMind centralises that knowledge: past incidents, root cause notes, remediation steps, and AI-generated summaries are all available in one place.

The application is built as a clean 3-tier system and is intentionally scoped to a working MVP. The goal is not to over-engineer the application layer, but to keep it simple enough that the infrastructure and DevOps work around it can be the main learning surface.

---

## Why This Project

This project exists for two reasons.

**Learning:** It is a hands-on project to explore cloud-native application design, DevOps workflows, container orchestration, GitOps, and cost-aware Azure deployments. The application code is kept deliberately straightforward so that all the interesting complexity lives in the platform layer.

**Resume:** It demonstrates a full-stack, cloud-native project built from scratch — one that can be walked through end to end in an interview, with real design decisions to explain at every layer.

---

## MVP Features

- View a list of all incidents, newest first
- Open any incident in a detail modal with full context
- Create a new incident with title, description, severity, affected service, and team
- Search incidents by keyword using full-text search across all fields
- Request an AI-generated summary for any incident: probable cause and suggested remediation
- AI runs in mock mode by default — no API key required for local development

---

## Architecture

OpsMind follows a standard **3-tier architecture**.

```
┌──────────────────────────────────┐
│         Presentation Tier        │
│   React + Vite (TypeScript)      │
│   Single-page ops dashboard      │
└────────────────┬─────────────────┘
                 │  REST / JSON
┌────────────────▼─────────────────┐
│         Application Tier         │
│   FastAPI (Python)               │
│   Routes, search, AI service     │
└────────────────┬─────────────────┘
                 │  SQLAlchemy ORM
┌────────────────▼─────────────────┐
│            Data Tier             │
│   PostgreSQL 16                  │
│   Incidents, full-text index     │
└──────────────────────────────────┘

<img width="3956" height="1745" alt="Blank diagram" src="https://github.com/user-attachments/assets/34bce3e1-6a5c-437f-af53-5e12c55d7df4" />

```

- The **frontend** is a single-page application. All state — the incident list, search results, selected incident, and AI response — lives in one Dashboard component. No client-side routing is needed.
- The **backend** owns all business logic. Routes are thin; search and AI logic live in dedicated service modules.
- The **database** handles persistence and search. PostgreSQL full-text search is used natively — no separate search service is needed for the MVP.

---

## Tech Stack

| Layer       | Technology                   | Purpose                                      |
|-------------|------------------------------|----------------------------------------------|
| Frontend    | React 18, Vite, TypeScript   | Ops dashboard UI                             |
| Backend     | FastAPI, Python 3.11         | REST API, business logic                     |
| Database    | PostgreSQL 16                | Data storage and full-text search            |
| ORM         | SQLAlchemy 2                 | Database access layer                        |
| Validation  | Pydantic v2                  | Request/response schema validation           |
| AI Service  | Mock (default) / Azure OpenAI | Incident summarization                      |

---

## Project Structure

```
OpsMind/
├── frontend/          # React + Vite SPA
├── backend/           # FastAPI application
└── README.md
```

Infrastructure, containerisation, Kubernetes manifests, CI/CD pipelines, and GitOps
configuration are implemented separately as part of the DevOps learning track.

---

## Search Design

OpsMind uses **PostgreSQL full-text search** (`tsvector` / `tsquery`) for the MVP.

When a search request arrives, the backend queries across all meaningful incident fields — title, description, RCA notes, remediation steps, service name, and team — using a single native PostgreSQL query. No additional service is needed.

**Why this approach was chosen:**
- No extra infrastructure to run or maintain
- PostgreSQL full-text search is production-relevant and commonly used
- Simpler to reason about and explain
- Keeps the MVP focused — fewer moving parts means faster feedback

**Phase 2 upgrade path:** Add the `pgvector` PostgreSQL extension and store sentence embeddings per incident. This enables semantic similarity search using the same database, with no new service to operate.

---

## AI Design

The AI summarization feature is intentionally minimal for the MVP.

When triggered, the backend sends the full incident context — title, description, severity, service, team, RCA notes, and remediation steps — to an LLM and receives a structured response with three fields: a plain-English summary, the probable cause, and suggested remediation steps.

**Mock mode (default):** Returns a realistic hardcoded response. The full UI flow works without any API key. This is the default for local development and demos.

**Real mode:** Set `USE_MOCK_AI=false` and supply Azure OpenAI credentials. No code change is required — it is a configuration switch.

The goal for this MVP is a working, explainable AI integration — not a complex pipeline. The design keeps the AI feature honest: one focused prompt, one structured response, one clear purpose.

---

## Local Development

### Prerequisites

- Python 3.11 or later
- Node.js 20 or later
- PostgreSQL 16 running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Required environment variables
export DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/opsmind
export USE_MOCK_AI=true

uvicorn app.main:app --reload
```

Runs at `http://localhost:8000` — API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

The Vite dev server proxies `/api` requests to the backend automatically, so no CORS
configuration is needed during development.

---

## API Summary

| Method | Endpoint                    | Purpose                              |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/incidents`            | List all incidents, newest first     |
| GET    | `/api/incidents/{id}`       | Get a single incident by ID          |
| POST   | `/api/incidents`            | Create a new incident                |
| GET    | `/api/search?q=`            | Full-text search across incidents    |
| POST   | `/api/ai/summarize/{id}`    | Generate AI summary for an incident  |
| GET    | `/health`                   | Backend health check                 |

---

## Cost-Aware Cloud Approach

Development happens locally. Azure is only used when a live demo, screenshot, or
interview walkthrough is needed — resources are started, used, and shut down.

This keeps the monthly cost close to zero while the project still demonstrates real
cloud-native deployment patterns. The application is designed to run on AKS with a
minimal node pool, Azure Database for PostgreSQL Flexible Server, and GHCR for
container images — all chosen for low cost at low traffic.

The DevOps layer is built for this model: manifests and pipelines work on-demand, not
as always-on infrastructure.

---

## Future Improvements

- **Semantic search** — pgvector extension + sentence embeddings for similarity-based incident retrieval
- **Real Azure OpenAI integration** — connect the existing AI service to a live deployment
- **Similar incidents panel** — surface the top related past incidents when viewing a new one
- **Runbooks** — a separate knowledge base for operational procedures, searchable and linkable to incidents
- **Incident timeline** — track status changes with timestamps (open → investigating → resolved)
- **Auth and access control** — basic user identity and team-scoped views
- **Production observability** — metrics endpoint, structured logging, Grafana dashboard

---

## Interview Talking Points

- **Why PostgreSQL full-text search?** It handles keyword search well at MVP scale, requires no extra infrastructure, and is a production-relevant technique. The upgrade path to `pgvector` semantic search is a clear, natural Phase 2 story.

- **Why is the AI feature minimal?** The goal is an explainable, working integration — not an over-engineered pipeline. One prompt, one structured response, one clear use case. Mock mode means it can be demonstrated without any API key.

- **Why a single-page UI with no routing?** The MVP has one primary workflow: browse incidents, open one, get a summary. A single page with a modal is the right level of complexity — adding a router would add overhead without adding value at this stage.

- **Why FastAPI for the backend?** It generates OpenAPI docs automatically, enforces request/response types through Pydantic, and is async-capable — a good fit for a backend that may eventually call external AI services concurrently.

- **Why is the architecture split the way it is?** Thin routes, logic in services. This makes the code easier to test, easier to swap dependencies, and easier to explain. The AI service, for example, is a single module — swapping mock for real Azure OpenAI is one environment variable.

- **What was the deliberate simplicity trade-off?** Fewer moving parts was a conscious choice. No message queues, no caching layer, no microservices. This keeps the application understandable and puts the engineering complexity where it belongs for this project — in the DevOps and infrastructure layer.

- **How does this support cloud-native deployment?** The application is stateless, environment-configured, and structured to run in containers behind a Kubernetes ingress. Horizontal scaling, config injection via secrets, and health checks are all built in from the start.

- **What would you change in production?** Add database migrations (Alembic), connection pooling (PgBouncer), structured logging, a real auth layer, and proper secret management. The MVP deliberately skips these to keep the focus on the core architecture.
