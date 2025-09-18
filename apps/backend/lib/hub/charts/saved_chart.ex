defmodule Hub.Charts.SavedChart do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}
  schema "charts" do
    field :chart_spec, :map
    field :query_meta, :map
    field :thumbnail, :string
    timestamps(inserted_at: :inserted_at, updated_at: false)
  end
end

