defmodule HubWeb.HealthControllerTest do
  use HubWeb.ConnCase, async: true

  test "GET /health returns ok", %{conn: conn} do
    conn = get(conn, "/health")
    assert conn.status == 200
    assert %{"ok" => true} = Jason.decode!(conn.resp_body)
  end
end

