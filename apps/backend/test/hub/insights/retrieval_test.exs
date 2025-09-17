defmodule Hub.Insights.RetrievalTest do
  use ExUnit.Case, async: true
  alias Hub.{Repo}
  alias Hub.Insights.{Retrieval, AAEvent}

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
  end

  test "aggregates by campaign for last 30 days" do
    now = DateTime.utc_now()
    old = DateTime.add(now, -40, :day)

    # Old row (should be ignored)
    Repo.insert!(%AAEvent{ts: DateTime.truncate(old, :second), campaign: "X", sessions: 10, conversions: 1, revenue: Decimal.new("1.0")})
    # Recent rows
    Repo.insert!(%AAEvent{ts: DateTime.truncate(now, :second), campaign: "A", sessions: 100, conversions: 10, revenue: Decimal.new("100.0")})
    Repo.insert!(%AAEvent{ts: DateTime.truncate(now, :second), campaign: "B", sessions: 50, conversions: 5, revenue: Decimal.new("50.0")})

    slice = Retrieval.retrieve_slice(:campaign)
    assert slice.context_table == "aa_events"
    assert is_binary(slice.sql_used)
    # Should not include old row X
    groups = Enum.map(slice.rows_shown, &(&1.group))
    assert "A" in groups
    assert "B" in groups
    refute "X" in groups
  end
end

