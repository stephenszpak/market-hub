import Config

config :hub, HubWeb.Endpoint,
  check_origin: ["//localhost"],
  server: true

config :logger, level: :info

