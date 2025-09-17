defmodule HubWeb.ApiController do
  use HubWeb, :controller

  def chat(conn, _params), do: not_implemented(conn)
  def charts(conn, _params), do: not_implemented(conn)
  def slides(conn, _params), do: not_implemented(conn)

  defp not_implemented(conn) do
    conn
    |> put_status(501)
    |> json(%{error: "not_implemented"})
  end
end

