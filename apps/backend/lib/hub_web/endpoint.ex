defmodule HubWeb.Endpoint do
  use HubWeb, :endpoint

  plug Plug.RequestId
  plug Plug.Logger

  plug CORSPlug, origin: ["http://localhost:5173"], methods: ["GET", "POST", "OPTIONS"]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason

  plug Plug.MethodOverride
  plug Plug.Head

  plug HubWeb.Router
end

