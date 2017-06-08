defmodule Playlistr.Music.Supervisor do
    use Supervisor

    def start_link do
        IO.puts "starting music supervisor"
        Supervisor.start_link(__MODULE__, :ok, name: __MODULE__)
    end

    def init(:ok) do
        children = [
            worker(Playlistr.Music, [], restart: :transient)
        ]

        supervise(children, strategy: :one_for_one)
    end
end