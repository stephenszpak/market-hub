defmodule HubWeb.ErrorJSON do
  def render("404.json", _assigns), do: %{error: "not_found"}
  def render("500.json", _assigns), do: %{error: "server_error"}
  def template_not_found(_template, _assigns), do: %{error: "unknown_error"}
end

