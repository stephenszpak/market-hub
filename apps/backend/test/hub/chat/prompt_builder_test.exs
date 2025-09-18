defmodule Hub.Chat.PromptBuilderTest do
  use ExUnit.Case, async: true
  alias Hub.Chat.PromptBuilder

  test "limits table snippet length" do
    rows =
      for i <- 1..50 do
        %{group: "G#{i}", sessions: i, conversions: div(i, 2), revenue: Decimal.new("#{i}")}
      end
    {prompt, meta} = PromptBuilder.build("sys", %{rows_shown: rows}, "what's up?")
    assert is_binary(prompt)
    assert meta.rows_included <= 20
    assert meta.snippet_chars <= 2000
  end
end
