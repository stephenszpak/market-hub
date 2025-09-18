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

    ".json" ->
      path
      |> File.read!()
      |> Jason.decode!()
      |> case do
        list when is_list(list) -> list
        _ -> raise "JSON file must contain an array of objects"
      end

    other ->
      raise "Unsupported file extension: #{other} (supported: .jsonl, .csv, .json)"
  end

parse_ts = fn v ->
  case v do
    %DateTime{} = dt -> DateTime.truncate(dt, :second)
    %NaiveDateTime{} = ndt -> DateTime.from_naive!(NaiveDateTime.truncate(ndt, :second), "Etc/UTC")
    %Date{} = d -> DateTime.new!(d, ~T[00:00:00], "Etc/UTC")
    s when is_binary(s) ->
      case DateTime.from_iso8601(s) do
        {:ok, dt, _offset} -> DateTime.truncate(dt, :second)
        _ ->
          # try date only
          case Date.from_iso8601(s) do
            {:ok, d} -> DateTime.new!(d, ~T[00:00:00], "Etc/UTC")
            _ -> raise "Invalid ts format: #{inspect(s)}"
          end
      end
  end
end

to_int = fn v ->
  cond do
    is_integer(v) -> v
    is_float(v) -> trunc(v)
    is_binary(v) -> String.to_integer(String.trim(v))
    true -> 0
  end
end

to_decimal = fn v ->
  cond do
    is_number(v) -> Decimal.from_float(v * 1.0)
    is_binary(v) -> Decimal.new(String.trim(v))
    true -> Decimal.new("0")
  end
end

transform = fn m ->
  ts_raw = Map.get(m, "ts") || Map.get(m, :ts)
  %{
    ts: parse_ts.(ts_raw),
    channel: Map.get(m, "channel") || Map.get(m, :channel),
    campaign: Map.get(m, "campaign") || Map.get(m, :campaign),
    page: Map.get(m, "page") || Map.get(m, :page),
    region: Map.get(m, "region") || Map.get(m, :region),
    sessions: to_int.(Map.get(m, "sessions") || Map.get(m, :sessions) || 0),
    conversions: to_int.(Map.get(m, "conversions") || Map.get(m, :conversions) || 0),
    revenue: to_decimal.(Map.get(m, "revenue") || Map.get(m, :revenue) || 0)
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
