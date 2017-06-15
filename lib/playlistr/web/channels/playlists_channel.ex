defmodule Playlistr.PlaylistsChannel do
    use Phoenix.Channel

    def join("playlists:lobby", _message, socket) do
        IO.puts "connecting to lobby"
        {:ok, socket}
    end
end