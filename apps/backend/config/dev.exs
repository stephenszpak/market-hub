import Config

config :hub, HubWeb.Endpoint,
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: []

config :hub, Hub.Repo,
  url: System.get_env("DATABASE_URL", "ecto://postgres:postgres@postgres:5432/marketing_hub_dev"),
  pool_size: 10,
  show_sensitive_data_on_connection_error: true

config :logger, level: :debug

