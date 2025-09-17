defmodule Hub.Repo.Migrations.CreateAAEvents do
  use Ecto.Migration

  def change do
    create table(:aa_events) do
      add :ts, :utc_datetime, null: false
      add :channel, :string
      add :campaign, :string
      add :page, :string
      add :region, :string
      add :sessions, :integer
      add :conversions, :integer
      add :revenue, :decimal
    end

    create index(:aa_events, [:ts])
    create index(:aa_events, [:channel])
    create index(:aa_events, [:campaign])
  end
end

