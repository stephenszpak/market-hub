defmodule Hub.Application do
  use Application

  def start(_type, _args) do
    # ensure ETS table for rate limiting exists
    try do
      :ets.new(Hub.RateLimit.Storage, [:named_table, :public, :set, read_concurrency: true])
    rescue
      _ -> :ok
    end

    children = [
      Hub.Repo,
      {Phoenix.PubSub, name: Hub.PubSub},
      HubWeb.Endpoint,
      {Finch, name: HubFinch}
    ]

    opts = [strategy: :one_for_one, name: Hub.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def config_change(changed, _new, removed) do
    HubWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
