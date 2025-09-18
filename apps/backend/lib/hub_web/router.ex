defmodule HubWeb.Router do
  use HubWeb, :router

  pipeline :api do
    plug :accepts, ["json", "event-stream"]
    plug HubWeb.Plugs.RateLimiter
  end

  scope "/", HubWeb do
    pipe_through :api
    get "/health", HealthController, :index
  end

  scope "/api", HubWeb do
    pipe_through :api
    post "/chat", ApiController, :chat
    get "/chat/stream", ApiController, :chat_sse
    post "/charts", ApiController, :charts
    post "/charts/save", ApiController, :charts_save
    get "/charts", ApiController, :charts_index
    post "/slides", ApiController, :slides
  end
end
