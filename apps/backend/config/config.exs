import Config

config :hub,
  ecto_repos: [Hub.Repo]

config :hub, HubWeb.Endpoint,
  url: [host: "localhost"],
  http: [ip: {0, 0, 0, 0}, port: 4000],
  render_errors: [formats: [json: HubWeb.ErrorJSON], layout: false],
  pubsub_server: Hub.PubSub,
  live_view: [signing_salt: "change_me"],
  secret_key_base: String.duplicate("a", 64)

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"

