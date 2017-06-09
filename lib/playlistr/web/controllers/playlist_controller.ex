defmodule Playlistr.Web.PlaylistController do
    use Playlistr.Web, :controller

    alias Bolt.Sips, as: Bolt

    def index(conn, params) do
        case params do
            %{ "playlist" => title, "password" => password } ->
                IO.puts "checking password playlist"

                cypher = """
                    MATCH (p:Playlist)
                    WHERE p.title = '#{title}' AND p.password = '#{password}'
                    OPTIONAL MATCH (p)-[:HAS]-(s:Song)
                    RETURN p AS playlist, s AS song
                """
                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, results} ->
                        case results do
                            [] ->
                                conn
                                |> put_status(401)
                                |> json(%{ :err => "Incorrect password"})
                            res ->
                                json conn, (res |> Playlistr.Music.get_playlist)
                        end
                    {:err, _} ->
                        conn
                        |> put_status(500)
                        |> json(%{ :err => "server error"})
                end

            %{ "playlist" => title } ->
                cypher = """
                    MATCH (p:Playlist)
                    WHERE p.title = '#{title}'
                    OPTIONAL MATCH (p)-[:HAS]-(s:Song)
                    RETURN p AS playlist, s AS song
                """
                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, results} ->
                        json conn, (results |> Playlistr.Music.get_playlist)
                end
            %{} ->
                cypher = """
                    MATCH (p:Playlist)
                    OPTIONAL MATCH (p)-[:HAS]-(s:Song)
                    RETURN p AS playlist, s AS song
                """
                # json conn, %{ :test => "data" }
                # json conn, %{ :playlists => Playlistr.Music.get_playlists()}
                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, results} ->
                        json conn, (results |> Playlistr.Music.get_playlists)
                    {:err, _} ->
                        json conn, %{ :err => "error" }
                end
        end
    end

    def add_playlist(conn, params) do
        case params do
            %{ 
                "title" => title,
                "category" => category,
                "password" => password,
                "openSubmissions" => open_submissions,
                "type" => type
            } ->
                creator = "rawhat"
                playlist = Playlistr.Playlist.init(title, category, password, open_submissions, type, creator)
                cypher = """
                    MATCH (u:User) WHERE u.username = "#{creator}"
				    CREATE (u)-[:CREATED { createdAt: "#{Playlistr.Music.get_current_epoch_time()}" }]->(p:Playlist {
                        title: "#{playlist.title}",
                        category: "#{playlist.category}",
                        password: "#{playlist.password}",
                        openSubmissions: "#{playlist.open_submissions}",
                        type: "#{playlist.type}",
                        length: "#{playlist.length}",
                        isPaused: "#{playlist.is_paused}",
                        startDate: "#{playlist.start_date}",
                        currentTime: "#{playlist.current_time}",
                        hasPlayed: "#{playlist.has_played}"
                    }) RETURN p AS playlist
                """

                case Bolt.query(Bolt.conn, cypher) do
                    {:ok, []} ->
                        conn
                        |> put_status(400)
                        |> json(%{ :error => "Playlist not created."})

                    {:ok, _} ->
                        conn
                        |> put_status(201)
                        |> json(%{ :status => "Created" })

                    {:err, _} ->
                        conn
                        |> put_status(500)
                        |> json(%{ :error => "Error.  Database command failed" })
                end

            _ ->
                conn
                |> put_status(400)
                |> json(%{ :status => "Error.  Invalid parameters" })
        end
    end
end