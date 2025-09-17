defmodule Hub.Application do
  use Application

  def start(_type, _args) do
    children = [
      Hub.Repo,
      {Phoenix.PubSub, name: Hub.PubSub},
      HubWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Hub.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def config_change(changed, _new, removed) do
    HubWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end

