defmodule Hub.Chat.PromptBuilder do
  @max_rows 20
  @max_snippet_chars 2000

  def build(system, data_slice, question) do
    sys = merge_system(system)
    dict = "Data dictionary: ts (UTC), channel, campaign, page, region, sessions, conversions, revenue."

    rows = (data_slice[:rows_shown] || []) |> Enum.take(@max_rows)
    table = table_snippet(rows) |> String.slice(0, @max_snippet_chars)
    prompt = Enum.join([sys, dict, "Sample:", table, "Question:", question], "\n\n")

    {prompt, %{rows_included: length(rows), snippet_chars: String.length(table)}}
  end

  def merge_system(nil), do: default_system()
  def merge_system(""), do: default_system()
  def merge_system(sys), do: sys <> "\n\n" <> formatting_instructions()

  defp default_system, do: "You are a helpful analytics assistant.\n\n" <> formatting_instructions()

  defp formatting_instructions do
    """
    You are a helpful assistant.
    Always return your answers using Markdown formatting:
    - Use **bold** for emphasis
    - Use ### for section headers
    - Use bullet lists where appropriate
    - Wrap code in ```language blocks
    """
  end

  defp table_snippet([]), do: "(no matching data)"
  defp table_snippet(rows) do
    headers = ["group", "sessions", "conversions", "revenue"]
    body =
      rows
      |> Enum.map(fn r ->
        [r[:group] || r["group"], r[:sessions] || 0, r[:conversions] || 0, r[:revenue] || 0]
        |> Enum.join(" | ")
      end)
      |> Enum.join("\n")
    Enum.join([Enum.join(headers, " | "), body], "\n")
  end
end
