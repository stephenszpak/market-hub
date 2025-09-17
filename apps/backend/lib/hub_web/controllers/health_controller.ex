defmodule HubWeb.HealthController do
  use HubWeb, :controller

  def index(conn, _params) do
    json(conn, %{ok: true})
  end
end

