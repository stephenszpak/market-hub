defmodule Hub.Repo.Migrations.CreateCharts do
  use Ecto.Migration

  def change do
    create table(:charts) do
      add :chart_spec, :map, null: false
      add :query_meta, :map
      add :thumbnail, :text
      timestamps(inserted_at: :inserted_at, updated_at: false)
    end
  end
end

