#!/usr/bin/env sh
set -e

export MIX_ENV=dev
export PHX_SERVER=true

# Ensure deps are present
mix deps.get

# Ensure MIME recompiled to pick up custom types (SSE)
mix deps.clean --build mime || true

# Wait for DB
echo "Waiting for Postgres..."
until nc -z ${POSTGRES_HOST:-postgres} ${POSTGRES_PORT:-5432}; do
  sleep 1
done

# Setup DB
mix ecto.create || true
mix ecto.migrate || true

# Ensure slides worker deps (dev volume overrides build layer)
NEED_INSTALL=0
if [ ! -d "slides_worker/node_modules" ]; then
  NEED_INSTALL=1
fi
if [ ! -d "slides_worker/node_modules/pptxgenjs" ]; then
  NEED_INSTALL=1
fi
if [ ! -d "slides_worker/node_modules/pdf-lib" ]; then
  NEED_INSTALL=1
fi
if [ "$NEED_INSTALL" = "1" ]; then
  echo "Installing slides worker deps..."
  cd slides_worker && npm install --no-audit --no-fund && cd ..
fi

echo "Starting Phoenix on :4000"
mix phx.server
