defmodule Playlistr.MusicUpdater do
    use GenServer

    alias Bolt.Sips, as: Bolt

    def start_link do
        GenServer.start_link(__MODULE__, %{})
    end

    def init(state) do
        schedule_work()
        {:ok, state}
    end

    def handle_info(:work, state) do
        # do stuff
        cypher = "MATCH (s:Song) RETURN s AS song"

        case Bolt.query(Bolt.conn, cypher) do
            {:ok, results} ->
                songs = results
                    |> Enum.map(&(&1["song"].properties))

                transaction_conn = Bolt.begin(Bolt.conn)
                songs |> Enum.each(fn song ->
                    {:ok, songData} = case song["isVideo"] do
                        true ->
                            song["url"] |> Playlistr.Music.parse_video

                        false ->
                            song["url"] |> Playlistr.Music.parse_audio
                    end

                    cypher = """
                        MATCH (s:Song)
                        WHERE s.url = "#{song["url"]}"
                        SET s.streamUrl = "#{songData["streamUrl"]}",
                            s.title = "#{songData["title"]
                                |> String.replace("\r", "")
                                |> String.replace("\n", "")
                                |> String.replace("\"", "")
                            }",
                            s.length = #{songData["length"]}
                        RETURN s
                    """

                    Bolt.query(transaction_conn, cypher)
                end)

                Bolt.commit(transaction_conn)

                cypher = """
                    MATCH (p:Playlist)
                    OPTIONAL MATCH (p)-[:HAS]-(s:Song)
                    RETURN p AS playlist, SUM(s.length) AS length
                """

                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, results} ->
                        transaction_conn = Bolt.begin(Bolt.conn)

                        results |> Enum.each(fn result ->
                            startDate = Map.get(result["playlist"].properties, "startDate")
                            startDate = cond do
                                is_integer(startDate) ->
                                    startDate
                                is_nil(startDate) ->
                                    nil
                                is_float(startDate) ->
                                    round(startDate)
                                true ->
                                    startDate
                            end
                            # startDate + length < current_epoch_time ? reset to nil : leave it
                            startDate = cond do
                                is_nil(startDate) ->
                                    nil
                                (startDate + result["length"]) < Playlistr.Music.get_current_epoch_time() ->
                                    nil
                                true ->
                                    startDate
                            end

                            cypher = """
                                MATCH (p:Playlist)
                                WHERE p.title = "#{result["playlist"].properties["title"]}"
                                SET p.startDate = #{if is_nil(startDate), do: "null", else: startDate}
                                RETURN p AS playlist
                            """

                            Bolt.query(transaction_conn, cypher)
                        end)

                        Bolt.commit(transaction_conn)

                    {:err, _} ->
                        IO.puts "Problem updating playlist start dates"
                end

            {:err, _} ->
                IO.puts "Error in song url updating"
        end

        schedule_work()
        {:noreply, state}
    end

    defp schedule_work do
        # run every 24 hours
        Process.send_after(self(), :work, 24 * 60 * 60 * 1000)
        # Process.send_after(self(), :work, 30 * 1000)
    end
end
