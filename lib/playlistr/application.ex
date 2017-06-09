defmodule Playlistr.Application do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec

    # Define workers and child supervisors to be supervised
    children = [
      # Start the endpoint when the application starts
      supervisor(Playlistr.Web.Endpoint, []),
      # Start your own worker by calling: Playlistr.Worker.start_link(arg1, arg2, arg3)
      # worker(Playlistr.Worker, [arg1, arg2, arg3]),
      # supervisor(Playlistr.Music.Supervisor, [])
      worker(Bolt.Sips, [Application.get_env(:bolt_sips, Bolt)])
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Playlistr.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def config_change(changed, _new, removed) do
    Playlistr.Web.Endpoint.config_change(changed, removed)
    :ok
  end
end
