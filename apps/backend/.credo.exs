%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "test/", "mix.exs"],
        excluded: []
      },
      checks: [
        {Credo.Check.Readability.ModuleDoc, false},
        {Credo.Check.Consistency.LineEndings, []},
        {Credo.Check.Design.TagTODO, exit_status: 0}
      ]
    }
  ]
}

