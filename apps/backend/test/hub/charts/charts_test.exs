defmodule Hub.ChartsTest do
  use ExUnit.Case, async: true
  alias Hub.{Repo}
  alias Hub.Insights.AAEvent
  alias Hub.Charts

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    Repo.insert!(%AAEvent{ts: now, channel: "Email", sessions: 100, conversions: 10})
    Repo.insert!(%AAEvent{ts: now, channel: "Social", sessions: 60, conversions: 6})
    :ok
  end

  test "parse_prompt chooses channel and y fields" do
    p = Charts.parse_prompt("sessions and conversions by channel last month")
    assert p.entity == :channel
    assert Enum.sort(p.y_fields) == ["conversions", "sessions"]
    assert p.date_range in [{:last_month}, {:days, 30}]
  end

  test "query_for aggregates when not timeseries" do
    parsed = %{
      entity: :channel,
      y_fields: ["sessions", "conversions"],
      date_range: {:days, 30},
      timeseries: false
    }
    rows = Charts.query_for(parsed)
    assert Enum.any?(rows, &(&1.group == "Email"))
  end
end
