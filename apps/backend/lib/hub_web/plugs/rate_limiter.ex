defmodule HubWeb.Plugs.RateLimiter do
  use PlugAttack

  rule "throttle per ip", conn do
    ip = Tuple.to_list(conn.remote_ip) |> Enum.join(".")

    throttle(ip,
      period: 60_000,
      limit: 30,
      storage: {PlugAttack.Storage.Ets, Hub.RateLimit.Storage}
    )
  end

  def block_action(conn, _opts) do
    conn
    |> Plug.Conn.put_resp_content_type("application/json")
    |> Plug.Conn.send_resp(429, Jason.encode!(%{error: "rate_limited"}))
  end
end
