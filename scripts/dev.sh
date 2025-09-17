#!/usr/bin/env bash
set -euo pipefail

echo "Starting all services (frontend :5173, backend :4000, scrapers :8000, postgres :5432)"
docker compose up --build

echo "Services:"
echo "- Backend:   http://localhost:4000/health"
echo "- Frontend:  http://localhost:5173"
echo "- Scrapers:  http://localhost:8000/health"
