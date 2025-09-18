# marketing-hub-poc

Lean monorepo proof-of-concept for a Marketing Insights Hub:

- React 18 + Vite frontend
- Phoenix 1.7 + Elixir 1.16 backend (Postgres)
- Python 3.11 FastAPI scrapers service

## Quickstart (Docker Compose)

1. Copy env: `cp .env.example .env`
2. Start services: `make up` or `./scripts/dev.sh`
3. Open:
   - Backend:  http://localhost:4000/health
   - Frontend: http://localhost:5173
   - Scrapers: http://localhost:8000/health

## OpenAI Config / Mock Mode

- Set `OPENAI_API_KEY` in `.env` to enable real OpenAI responses for `/api/chat`.
- Optional: `OPENAI_MODEL` sets the model (default `gpt-4o-mini`).
- If `OPENAI_API_KEY` is unset, the backend serves mock streaming responses for development.

## How to load mock Adobe data

1. Place a JSONL or CSV file at the path in `ADOBE_MOCK_DATA_PATH` (default `./data/adobe/mock.jsonl`, relative to the backend container working dir `/app`).
2. Seed the DB: `make seed` (runs `mix run priv/repo/seeds.exs`).

Accepted columns for CSV/JSONL (aa_events):
- ts (ISO8601), channel, campaign, page, region, sessions (int), conversions (int), revenue (numeric)

## Repo Structure

## KPI Style Guide (Charts)

- KPIs: sessions, conversions, CTR, CVR, revenue
- Prefer concise Markdown tables; limit to essential columns
- Keep commentary non-technical: 2–3 sentences on trends/outliers
- Date ranges: last 7/30 days or last month unless specified

```
marketing-hub-poc/
  apps/
    backend/   # Phoenix API
    frontend/  # Vite + React
    scrapers/  # FastAPI
  .github/workflows/ci.yml
  docker-compose.yml
  Makefile
  scripts/dev.sh
```

## Dev Tooling

- Frontend: ESLint + Prettier + Jest/RTL
- Backend: mix format + Credo + ExUnit
- Scrapers: Ruff + Black + Pytest
