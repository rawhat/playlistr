defmodule Playlistr.User do
    alias Bolt.Sips, as: Bolt

    def get_user_by_username(username) do
        query = """
            MATCH (u:User)
            WHERE u.username = '#{username}'
            RETURN u AS user
        """
        case Bolt.query(Bolt.conn, query) do
            {:ok, results} ->
                ((hd results)
                |> Map.get("user")).properties
                |> Map.delete("password")
            _ ->
                nil
        end
    end

    def test_user_credentials(username, password) do
        query = """
            MATCH (u:User)
            WHERE u.username = '#{username}'
            AND u.password = '#{password}'
            RETURN u AS user
        """

        case Bolt.query(Bolt.conn, query) do
            {:ok, results} ->
                {:ok, ((hd results) |> Map.get("user")).properties
                    |> Map.delete("password")
                }
            _ ->
                {:error, nil}
        end
    end

    def create_user(username, email, password, password_repeat) do
        if password != password_repeat do
            # really shouldn't need this, but just to be safe
            {:error, "Passwords do not match"}
        else
            query = """
                CREATE (u:User {
                    username: '#{username}',
                    email: '#{email}',
                    password: '#{password}',
                    createdAt: #{Playlistr.Music.get_current_epoch_time()}
                }) RETURN u AS user
            """

            case Bolt.query(Bolt.conn, query) do
                {:ok, results} ->
                    {:ok, ((hd results) |> Map.get("user")).properties
                        |> Map.delete("password")}
                {:err, _} ->
                    {:error, "Could not create user"}
            end
        end
    end
end
