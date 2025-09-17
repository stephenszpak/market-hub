defmodule HubWeb do
  def controller do
    quote do
      use Phoenix.Controller, formats: [:json], layouts: []
      import Plug.Conn
    end
  end

  def router do
    quote do
      use Phoenix.Router
      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def endpoint do
    quote do
      use Phoenix.Endpoint, otp_app: :hub
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end

