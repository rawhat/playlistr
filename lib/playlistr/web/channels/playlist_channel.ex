defmodule Playlistr.PlaylistChannel do
    use Phoenix.Channel

    def join("playlist:" <> title, _message, socket) do
        IO.puts ("connecting to " <> title)
        {:ok, socket}
    end
end
