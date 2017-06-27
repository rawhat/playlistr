"""
    conn = put_session(conn, :message, "new stuff we just set in the session")
    message = get_session(conn, :message)
"""

defmodule Playlistr.Web.AuthController do
    use Phoenix.Controller
    alias Playlistr.User, as: User

    alias Bolt.Sips, as: Bolt

    def auth_test(conn, _params) do
        try do
            conn = conn |> fetch_session

            username = get_session(conn, :user)

            case username do
                nil ->
                    conn
                    |> put_status(:unauthorized)
                    |> json(%{ :error => "Unauthorized" })

                _ ->
                    case User.get_user_by_username(username) do
                        nil ->
                            conn
                            |> put_status(:unauthorized)
                            |> json(%{ :error => "Unauthorized" })
                            
                        user ->
                            conn
                            |> put_status(:ok)
                            |> json(user)
                    end
            end

        rescue
            _ -> 
                conn 
                |> put_status(:unauthorized)
                |> json(%{})
        end
    end

    def login(conn, params) do
        case params do
            %{"username" => username, "password" => password} ->
                case User.test_user_credentials(username, password) do
                    {:ok, user} ->
                        conn = conn |> fetch_session |> put_session(:user, username)

                        conn
                        |> put_status(:ok)
                        |> json(user)

                    {_, _} ->
                        conn
                        |> put_status(:unauthorized)
                        |> json(%{:error => "Invalid credentials"})

                end

            _ ->
                conn
                |> put_status(:bad_request)
                |> json(%{:error => "Missing parameters"})
        end
    end

    def logout(conn, params) do
        try do
            conn = conn |> fetch_session |> delete_session(:user)

            conn
            |> put_status(:ok)
            |> redirect(to: "/")

        rescue
            _ ->
                conn
                |> put_status(:ok)
                |> redirect(to: "/")
        end
    end

    def signup(conn, params) do
        case params do
            %{ "username" => username, "password" => password, "email" => email, "password_repeat" => password_repeat } ->
                case User.create_user(username, email, password, password_repeat) do
                    {:ok, user} ->
                        conn = conn |> fetch_session |> put_session(:user, username)

                        conn
                        |> put_status(:created)
                        |> json(user)

                    {:error, message} ->
                        conn
                        |> put_status(:conflict)
                        |> json(%{:error => message})
                end

            _ ->
                conn
                |> put_status(:bad_request)
                |> json(%{:error => "Missing parameters"})
        end
    end
end