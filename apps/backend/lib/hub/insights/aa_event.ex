defmodule Hub.Insights.AAEvent do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}
  schema "aa_events" do
    field :ts, :utc_datetime
    field :channel, :string
    field :campaign, :string
    field :page, :string
    field :region, :string
    field :sessions, :integer
    field :conversions, :integer
    field :revenue, :decimal
  end
end

