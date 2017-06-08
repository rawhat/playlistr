defmodule Playlistr.Web.Router do
  use Playlistr.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/login", Playlistr.Web do
    pipe_through :api

    post "/", AuthController, :login
  end

  scope "/logout", Playlistr.Web do
    pipe_through :api

    get "/", AuthController, :logout
  end

  scope "/signup", Playlistr.Web do
    pipe_through :api

    post "/", AuthController, :signup
  end

  scope "/song", Playlistr.Web do
    pipe_through :api

    get "/", SongController, :index
    put "/", SongController, :add_song
    # post "/", SongController, :get_song
    get "/next", SongController, :next_song
  end

  scope "/playlist", Playlistr.Web do
    pipe_through :api

    get "/", PlaylistController, :index
    put "/", PlaylistController, :add_playlist
  end

  scope "/", Playlistr.Web do
    pipe_through :browser # Use the default browser stack

    get "/*path", PageController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", Playlistr.Web do
  #   pipe_through :api
  # end
end
