defmodule Hub.Insights.Retrieval do
  import Ecto.Query
  alias Hub.{Repo}
  alias Hub.Insights.AAEvent

  @doc """
  Classify question for retrieval and pick a grouping key.
  Returns {:retrieval, group_key} | :general
  """
  def classify(question) when is_binary(question) do
    q = String.downcase(question)

    if mentions_any?(q, ["campaign", "channel", "region", "sessions", "conversions", "revenue"]) do
      cond do
        String.contains?(q, "campaign") -> {:retrieval, :campaign}
        String.contains?(q, "channel") -> {:retrieval, :channel}
        String.contains?(q, "region") -> {:retrieval, :region}
        true -> {:retrieval, :campaign}
      end
    else
      :general
    end
  end

  defp mentions_any?(q, kws), do: Enum.any?(kws, &String.contains?(q, &1))

  @doc """
  Returns %{context_table, rows_shown, sql_used}
  Computes last 30 days aggregate totals grouped by `group_key`.
  """
  def retrieve_slice(group_key) when group_key in [:campaign, :channel, :region] do
    since = DateTime.utc_now() |> DateTime.add(-30, :day) |> DateTime.truncate(:second)

    field = group_key
    query =
      from e in AAEvent,
        where: e.ts > ^since,
        group_by: field(e, ^field),
        select: %{
          group: field(e, ^field),
          sessions: sum(e.sessions),
          conversions: sum(e.conversions),
          revenue: coalesce(sum(e.revenue), 0)
        },
        order_by: [desc: sum(e.sessions)],
        limit: 20

    rows = Repo.all(query)

    sql =
      "select #{group_key}, sum(sessions), sum(conversions), sum(revenue) from aa_events where ts > now() - interval '30 days' group by 1 order by 2 desc limit 20"

    %{context_table: "aa_events", rows_shown: rows, sql_used: sql}
  end
end
