defmodule HubWeb.ApiController do
  use HubWeb, :controller
  alias Hub.{Repo}
  alias Hub.Queries.Query
  alias Hub.Insights.Retrieval
  alias Hub.Chat.PromptBuilder

  def chat(conn, params) do
    with %{"question" => question} <- params do
      system = Map.get(params, "system")

      mode = Retrieval.classify(question)
      slice = case mode do
        {:retrieval, key} -> Retrieval.retrieve_slice(key)
        :general -> %{context_table: nil, rows_shown: [], sql_used: nil}
      end

      {prompt, _meta} = PromptBuilder.build(system, slice, question)

      conn =
        conn
        |> put_resp_header("content-type", "application/x-ndjson")
        |> send_chunked(200)

      # Send context meta first
      {:ok, conn} = chunk(conn, Jason.encode!(%{type: "meta", context_meta: slice}) <> "\n")

      # Stream response (mock if no API key)
      {text, meta} = stream_or_mock(prompt)

      # stream chunks to client
      for chunk_text <- meta[:chunks] do
        :timer.sleep(10)
        {:ok, conn} = chunk(conn, Jason.encode!(%{type: "delta", content: chunk_text}) <> "\n")
      end

      # persist
      Repo.insert!(%Query{question: question, response: %{mode: inspect(mode), meta: slice, answer: text}})

      chunk(conn, Jason.encode!(%{type: "done"}) <> "\n")
    else
      _ -> json(conn |> put_status(400), %{error: "invalid_body"})
    end
  end

  def chat_sse(conn, params) do
    with q when is_binary(q) <- Map.get(params, "question") do
      system = Map.get(params, "system")

      mode = Retrieval.classify(q)
      slice = case mode do
        {:retrieval, key} -> Retrieval.retrieve_slice(key)
        :general -> %{context_table: nil, rows_shown: [], sql_used: nil}
      end

      {prompt, _meta} = PromptBuilder.build(system, slice, q)
      sys_merged = PromptBuilder.merge_system(system)

      conn =
        conn
        |> Plug.Conn.put_resp_header("content-type", "text/event-stream")
        |> Plug.Conn.put_resp_header("cache-control", "no-cache")
        |> Plug.Conn.put_resp_header("connection", "keep-alive")
        |> send_chunked(200)

      # meta first
      {:ok, conn} = sse_chunk(conn, "meta", %{context_meta: slice})

      {conn, text} =
        case System.get_env("OPENAI_API_KEY") do
          nil ->
            # mock stream
            text = "This is a mock AI answer based on your data slice."
            for ch <- String.codepoints(text) do
              :timer.sleep(10)
              {:ok, conn} = sse_chunk(conn, "delta", %{content: ch})
              conn = conn
            end
            {conn, text}

          api_key ->
            {conn2, full} = stream_openai(conn, prompt, sys_merged, api_key)
            {conn2, full}
        end

      Repo.insert!(%Query{question: q, response: %{mode: inspect(mode), meta: slice, answer: text}})

      sse_chunk(conn, "done", %{})
    else
      _ -> json(conn |> put_status(400), %{error: "invalid_query"})
    end
  end
  def charts(conn, _params), do: not_implemented(conn)
  def slides(conn, _params), do: not_implemented(conn)

  defp not_implemented(conn) do
    conn
    |> put_status(501)
    |> json(%{error: "not_implemented"})
  end

  defp stream_or_mock(_prompt) do
    case System.get_env("OPENAI_API_KEY") do
      nil ->
        text = "This is a mock AI answer based on your data slice."
        chunks = String.codepoints(text)
        {text, %{chunks: chunks}}
      _key ->
        # Minimal non-streaming fallback when API key is present; you can extend to real streaming
        text = "(Live AI call configured; implement OpenAI streaming as needed.)"
        chunks = String.codepoints(text)
        {text, %{chunks: chunks}}
    end
  end

  defp sse_chunk(conn, event, data) do
    payload = "event: #{event}\n" <> "data: " <> Jason.encode!(data) <> "\n\n"
    chunk(conn, payload)
  end

  defp stream_openai(conn, prompt, system, api_key) do
    model = System.get_env("OPENAI_MODEL", "gpt-4o-mini")
    url = "https://api.openai.com/v1/chat/completions"
    headers = [
      {"authorization", "Bearer #{api_key}"},
      {"content-type", "application/json"}
    ]
    messages = [
      %{role: "system", content: system || "You are a helpful analytics assistant."},
      %{role: "user", content: prompt}
    ]
    body = Jason.encode!(%{model: model, messages: messages, temperature: 0.2, stream: true})

    req = Finch.build(:post, url, headers, body)

    acc0 = %{conn: conn, buf: "", text: ""}
    {:ok, acc} = Finch.stream(req, HubFinch, acc0, fn
      {:status, _code}, acc -> acc
      {:headers, _headers}, acc -> acc
      {:data, chunk}, acc ->
        buf = acc.buf <> chunk
        {complete, rest} = split_lines(buf)
        {conn, text} =
          Enum.reduce(complete, {acc.conn, acc.text}, fn line, {c, t} ->
            case parse_sse_data(line) do
              {:data, "[DONE]"} -> {c, t}
              {:data, json} ->
                with {:ok, payload} <- Jason.decode(json),
                     content <- get_in(payload, ["choices", Access.at(0), "delta", "content"]),
                     true <- is_binary(content) do
                  case sse_chunk(c, "delta", %{content: content}) do
                    {:ok, c2} -> {c2, t <> content}
                    _ -> {c, t}
                  end
                else
                  _ -> {c, t}
                end
              :ignore -> {c, t}
            end
          end)

        %{acc | conn: conn, buf: rest, text: text}
    end)

    {acc.conn, acc.text}
  end

  defp split_lines(buf) do
    parts = String.split(buf, "\n")
    case Enum.split(parts, -1) do
      {init, [last]} -> {init, last}
      _ -> {parts, ""}
    end
  end

  defp parse_sse_data(line) do
    line = String.trim_leading(line)
    cond do
      String.starts_with?(line, "data: ") -> {:data, String.replace_prefix(line, "data: ", "")}
      String.starts_with?(line, ":") -> :ignore
      line == "" -> :ignore
      true -> :ignore
    end
  end
end
