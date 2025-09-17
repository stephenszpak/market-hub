alias Hub.{Repo}
alias Hub.Insights.AAEvent

path = System.get_env("ADOBE_MOCK_DATA_PATH", "./data/adobe/mock.jsonl")
IO.puts("Seeding from #{path} ...")

unless File.exists?(path) do
  IO.puts("File not found: #{path}. Skipping.")
  System.halt(0)
end

ext = Path.extname(path) |> String.downcase()

rows =
  case ext do
    ".jsonl" ->
      File.stream!(path)
      |> Stream.map(&String.trim/1)
      |> Stream.reject(&(&1 == ""))
      |> Enum.map(&Jason.decode!/1)

    ".csv" ->
      defmodule CSVParser do
        NimbleCSV.define(__MODULE__, separator: ",", escape: "\"")
      end

      [headers | data] =
        path
        |> File.stream!()
        |> CSVParser.parse_string()
        |> Enum.to_list()

      Enum.map(data, fn row ->
        headers
        |> Enum.zip(row)
        |> Enum.into(%{})
      end)

    other ->
      raise "Unsupported file extension: #{other}"
  end

transform = fn m ->
  %{
    ts: m["ts"] || m[:ts] |> DateTime.from_iso8601() |> elem(1) |> DateTime.truncate(:second),
    channel: m["channel"] || m[:channel],
    campaign: m["campaign"] || m[:campaign],
    page: m["page"] || m[:page],
    region: m["region"] || m[:region],
    sessions: (m["sessions"] || m[:sessions] || 0) |> to_string() |> String.to_integer(),
    conversions: (m["conversions"] || m[:conversions] || 0) |> to_string() |> String.to_integer(),
    revenue: case (m["revenue"] || m[:revenue] || "0") do
      n when is_number(n) -> Decimal.from_float(n * 1.0)
      s when is_binary(s) -> Decimal.new(s)
    end
  }
end

entries = Enum.map(rows, transform)

Repo.transaction(fn ->
  Repo.delete_all(AAEvent)
  entries
  |> Enum.chunk_every(500)
  |> Enum.each(fn chunk ->
    Repo.insert_all(AAEvent, chunk)
  end)
end)

IO.puts("Seeded aa_events: #{length(entries)} rows")

