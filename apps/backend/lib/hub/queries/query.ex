defmodule Hub.Queries.Query do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}
  schema "queries" do
    field :user_id, :string
    field :question, :string
    field :response, :map
    timestamps(inserted_at: :inserted_at, updated_at: false)
  end
end

