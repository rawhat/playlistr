defmodule Playlistr.ChatChannel do
    use Phoenix.Channel

    def join("playlist:chat:" <> title, _message, socket) do
        IO.puts ("connecting to chat for " <> title)
        {:ok, socket}
    end

    def handle_in("message", msg, socket) do
        broadcast! socket, "message", %{ user: msg["user"], message: msg["message"] }
        {:reply, {:ok, %{msg: msg["message"]}}, assign(socket, :user, msg["user"])}
    end
end
