defmodule Playlistr.Web.PlaylistController do
    use Playlistr.Web, :controller

    def index(conn, params) do
        # json conn, %{ ... }
        case params do
            %{ "playlist" => title, "password" => password } ->
                IO.puts "checking password playlist"

                cypher = """
                    MATCH (p:Playlist)
                    WHERE p.title = '#{title}' AND p.password = '#{password}'
                    OPTIONAL MATCH (p)-[:HAS]-(s:Song)
                    RETURN p AS playlist, s AS song
                """
                case Bolt.Sips.query(Bolt.Sips.conn, cypher) do
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
                case Bolt.Sips.query(Bolt.Sips.conn, cypher) do
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
                case Bolt.Sips.query(Bolt.Sips.conn, cypher) do
                    {:ok, results} ->
                        json conn, (results |> Playlistr.Music.get_playlists)
                    {:err, _} ->
                        json conn, %{ :err => "error" }
                end
        end
    end

    def add_playlist(conn, _params) do
        conn
        |> send_resp(200, "")
    end
end