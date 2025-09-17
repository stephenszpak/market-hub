defmodule HubWeb.Router do
  use HubWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", HubWeb do
    pipe_through :api
    get "/health", HealthController, :index
  end

  scope "/api", HubWeb do
    pipe_through :api
    post "/chat", ApiController, :chat
    post "/charts", ApiController, :charts
    post "/slides", ApiController, :slides
  end
end

