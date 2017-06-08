defmodule Playlistr.Web.PageController do
  use Playlistr.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
