defmodule Hub.Charts do
  import Ecto.Query
  alias Hub.{Repo}
  alias Hub.Insights.AAEvent

  @type chart_spec :: %{
          required(:type) => String.t(),
          required(:xField) => String.t(),
          required(:yFields) => [String.t()],
          optional(:groupBy) => String.t(),
          optional(:timeseries) => boolean()
        }

  def parse_prompt(prompt) when is_binary(prompt) do
    p = String.downcase(prompt)

    entity =
      cond do
        String.contains?(p, "campaign") -> :campaign
        String.contains?(p, "channel") -> :channel
        String.contains?(p, "region") -> :region
        true -> nil
      end

    y_fields =
      [
        if(String.contains?(p, "session"), do: "sessions"),
        if(String.contains?(p, "conversion"), do: "conversions"),
        if(String.contains?(p, "revenue"), do: "revenue")
      ]
      |> Enum.reject(&is_nil/1)
      |> then(fn ys -> if ys == [], do: ["sessions", "conversions"], else: ys end)

    timeseries = String.contains?(p, ["by day", "daily", "timeseries", "over time"]) || false

    date_range =
      cond do
        String.contains?(p, ["last month"]) -> {:last_month}
        String.contains?(p, ["last 30 days", "past 30 days"]) -> {:days, 30}
        String.contains?(p, ["last 7 days", "past week"]) -> {:days, 7}
        true -> {:days, 30}
      end

    spec = %{
      type: if(timeseries, do: "line", else: "bar"),
      xField: if(timeseries, do: "ts", else: "group"),
      yFields: y_fields,
      groupBy: if(timeseries, do: to_string(entity || :channel), else: nil),
      timeseries: timeseries
    }

    %{
      entity: entity,
      y_fields: y_fields,
      date_range: date_range,
      timeseries: timeseries,
      spec: spec
    }
  end

  def query_for(%{entity: entity, y_fields: y_fields, date_range: date_range, timeseries: ts}) do
    since =
      case date_range do
        {:days, n} ->
          DateTime.utc_now()
          |> DateTime.add(-n * 24 * 60 * 60, :second)
          |> DateTime.truncate(:second)

        {:last_month} ->
          now = Date.utc_today()
          first_this = Date.beginning_of_month(now)
          first_last = Date.add(first_this, -1) |> Date.beginning_of_month()
          DateTime.new!(first_last, ~T[00:00:00], "Etc/UTC")
      end

    group_field = entity || :channel

    base = from e in AAEvent, where: e.ts >= ^since

    q =
      if ts do
        # timeseries by day and group
        from e in base,
          group_by: [fragment("date(?)", e.ts), field(e, ^group_field)],
          select: %{
            ts: fragment("date(?)", e.ts),
            group: field(e, ^group_field),
            sessions: sum(e.sessions),
            conversions: sum(e.conversions),
            revenue: coalesce(sum(e.revenue), 0)
          },
          order_by: [asc: fragment("date(?)", e.ts)]
      else
        from e in base,
          group_by: field(e, ^group_field),
          select: %{
            group: field(e, ^group_field),
            sessions: sum(e.sessions),
            conversions: sum(e.conversions),
            revenue: coalesce(sum(e.revenue), 0)
          },
          order_by: [desc: sum(e.sessions)]
      end

    rows = Repo.all(q)

    # compact rows to only needed y_fields
    rows2 =
      rows
      |> Enum.map(fn r ->
        r
        |> Map.take([:ts, :group, :sessions, :conversions, :revenue])
        |> then(fn m ->
          allowed = Enum.map(y_fields, &String.to_atom/1) ++ [:ts, :group]
          Map.take(m, allowed)
        end)
        |> normalize_row()
      end)

    rows2
  end

  def suggestions(%{entity: nil}) do
    ["by channel", "by campaign", "by region"]
  end
  def suggestions(_), do: []

  defp normalize_row(m) do
    m
    |> maybe_stringify_ts()
    |> map_decimal_to_float()
  end

  defp maybe_stringify_ts(%{ts: %Date{} = d} = m), do: Map.put(m, :ts, Date.to_iso8601(d))
  defp maybe_stringify_ts(m), do: m

  defp map_decimal_to_float(m) do
    Enum.into(m, %{}, fn {k, v} ->
      case v do
        %Decimal{} = d -> {k, Decimal.to_float(d)}
        _ -> {k, v}
      end
    end)
  end
end
