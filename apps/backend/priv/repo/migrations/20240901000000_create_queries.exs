defmodule Hub.Repo.Migrations.CreateQueries do
  use Ecto.Migration

  def change do
    create table(:queries) do
      add :user_id, :string, null: true
      add :question, :text, null: false
      add :response, :map, null: true
      timestamps(inserted_at: :inserted_at, updated_at: false)
    end
  end
end

