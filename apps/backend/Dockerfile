FROM elixir:1.16-alpine

ENV LANG=C.UTF-8
WORKDIR /app

# Install build deps
RUN apk add --no-cache build-base git openssl-dev inotify-tools netcat-openbsd

# Prepare mix
RUN mix local.hex --force && mix local.rebar --force

# Cache deps
COPY mix.exs .
COPY config ./config
RUN MIX_ENV=dev mix deps.get

# Copy app
COPY . .

EXPOSE 4000
CMD ["sh", "./scripts/dev.sh"]
