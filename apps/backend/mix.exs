defmodule Hub.MixProject do
  use Mix.Project

  def project do
    [
      app: :hub,
      version: "0.1.0",
      elixir: "~> 1.16",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      mod: {Hub.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.6"},
      {:cors_plug, "~> 3.0"},
      {:nimble_csv, "~> 1.2"},
      {:req, "~> 0.5"},
      {:finch, "~> 0.16"},
      {:plug_attack, "~> 0.4"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false}
    ]
  end
end
