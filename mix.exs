defmodule Playlistr.Mixfile do
  use Mix.Project

  def project do
    [app: :playlistr,
     version: "0.0.1",
     elixir: "~> 1.4",
     elixirc_paths: elixirc_paths(Mix.env),
     compilers: [:phoenix, :gettext] ++ Mix.compilers,
     start_permanent: Mix.env == :prod,
     deps: deps()]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
   [ applications: [:bolt_sips],
     mod: {Playlistr.Application, []},
     extra_applications: [:logger, :runtime_tools], mod: {Bolt.Sips.Application, [
          url: "localhost:7687",
          basic_auth: [username: "neo4j", password: "Password12"]
      ]}]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_),     do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [{:phoenix, "~> 1.3.0-rc2"},
     {:phoenix_pubsub, "~> 1.0"},
     {:phoenix_html, "~> 2.6"},
     {:phoenix_live_reload, "~> 1.0", only: :dev},
     {:gettext, "~> 0.11"},
     {:cowboy, "~> 1.0"},
     {:bolt_sips, "~> 0.3"},
     {:poison, "~> 3.1.0"}]
  end
end
