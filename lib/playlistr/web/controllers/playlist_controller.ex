defmodule Playlistr.Web.PlaylistController do
    use Playlistr.Web, :controller

    def index(conn, params) do
        # json conn, %{ ... }
        case params do
            %{ "playlist" => title, "password" => password } ->
                json conn, %{ :title => title, :password => password }
            %{ "playlist" => title } ->
                json conn, %{ :title => title }
            %{} ->
                # json conn, %{ :test => "data" }
                json conn, %{ :playlists => Playlistr.Music.get_playlists()}
        end
    end

    def add_playlist(conn, _params) do
        conn
        |> send_resp(200, "")
    end
end