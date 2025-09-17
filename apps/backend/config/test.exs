import Config

config :hub, HubWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false

config :hub, Hub.Repo,
  url: System.get_env("DATABASE_URL", "ecto://postgres:postgres@postgres:5432/marketing_hub_test"),
  pool: Ecto.Adapters.SQL.Sandbox

config :logger, level: :warning

