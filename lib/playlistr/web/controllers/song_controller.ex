defmodule Playlistr.Web.SongController do
    use Playlistr.Web, :controller

    alias Bolt.Sips, as: Bolt

    def index(conn, params) do
        case params do
            %{ "playlist" => title } ->
                cypher = """
                    MATCH (p:Playlist)-[:HAS]-(s:Song)
                    WHERE p.title = '#{title}'
                    RETURN p AS playlist, s AS songs
                """

                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, []} ->
                        conn
                        |> put_status(400)
                        |> json(%{ :error => "Playlist doesn't exist." })

                    {:ok, results} ->
                        %{:song => songData, :startDate => startDate} = results |> Playlistr.Music.get_current_song_and_playtime
                        playedUpdate = if songData.time == -1, do: "SET p.hasPlayed = true", else: ""
                        case Bolt.query(Bolt.conn, """
                            MATCH (p:Playlist)
                            WHERE p.title = '#{title}'
                            SET p.startDate = #{startDate}
                            SET p.lastPlayedDate = #{startDate}
                            #{playedUpdate}
                            RETURN p AS playlist
                        """) do
                            _ ->
                                IO.puts playedUpdate
                                json conn, (Map.merge songData, %{ hasPlayed: (if playedUpdate == "", do: false, else: true)})
                        end

                    {:err, _} ->
                        conn
                        |> put_status(500)
                        |> json(%{ :error => "Query failed" })
                end

            _ ->
                conn
                |> put_status(400)
                |> json(%{ :error => "Invalid parameter." })
        end

    end

    def add_song(conn, params) do
        conn = conn |> fetch_session

        currentUser = conn |> get_session(:user)

        case params do
            # Also check openSubmissions / creator? also maybe password?
            # Might not need to check password if they have access to the playlist
            %{ "title" => title, "type" => type, "songUrl" => songUrl } ->
                # remove this
                creator = "rawhat"

                processedLink = case type do
                    "music" ->
                        songUrl |> Playlistr.Music.parse_audio

                    "video" ->
                        songUrl |> Playlistr.Music.parse_video

                    _ ->
                        nil
                end

                case processedLink do
                    nil ->
                        conn
                        |> put_status(400)
                        |> json(%{ :error => "Invalid type parameter" })

                    link ->
                        cypher = """
                            MATCH (p:Playlist) WHERE p.title = '#{title}'
                            OPTIONAL MATCH (p)-[r:HAS]-(:Song)
                            WITH p, COUNT(r) AS songCount
                            CREATE UNIQUE (p)-[:HAS { addedAt: '#{Playlistr.Music.get_current_epoch_time()}' }]->(s:Song {
                                info: '#{link.info}',
                                isVideo: #{if type == "video", do: true, else: false},
                                url: '#{link.url}',
                                length: '#{link.length}',
                                streamUrl: '#{processedLink}',
                                index: songCount
                            })
                            RETURN p as playlist, s AS song`,
                        """

                        case Bolt.query(Bolt.conn, cypher) do
                            {:ok, []} ->
                                conn
                                |> put_status(500)
                                |> json(%{ :error => "Song not added" })

                            {:ok, results} ->
                                addedSong = results[0]["song"].properties
                                Playlistr.Web.Endpoint.broadcast("playlist:" <> title, "new-song", addedSong)

                                conn
                                |> put_status(201)
                                |> json(%{ :status => "Created"})

                            {:err, _} ->
                                conn
                                |> put_status(500)
                                |> json(%{ :error => "Error adding song" })
                        end
                end

            _ ->
                conn
                |> put_status(400)
                |> json(%{ :error => "Invalid parameters." })
        end
    end
end
