defmodule Playlistr.Music do
    use GenServer

    # util functions
    def get_current_epoch_time do
        DateTime.utc_now() 
        |> DateTime.to_unix(:millisecond)
    end

    def convertTime(timeString) do
        IO.puts(timeString)
        segments = timeString
            |> String.split(":")
            |> Enum.map(fn elem -> String.to_integer(elem) end)

        case length(segments) do
            1 ->
                hd segments
            2 ->
                segments[0] * 60 + segments[1]
            3 ->
                segments[0] * 3600 + segments[1] * 60 + segments[2]
            _ ->
                0
        end
    end

    def get_best_quality(formats, isVideo) do
        case isVideo do
            true ->
                formats
                    |> Enum.filter(fn format -> 
                        Map.has_key?(format, "vcodec") && format["vcodec"] != "none" && Map.has_key?(format, "resolution")
                    end)
                    |> Enum.sort(fn(video1, video2) ->
                        (video1["width"] * video1["height"]) > (video2["width"] * video2["height"])
                    end)
            false ->
                formats
                    |> Enum.filter(fn format ->
                        Enum.member?(["opus", "mp3", "vorbis"], String.trim(format["acodec"]))
                    end)
                    |> Enum.sort(fn(audio1, audio2) ->
                        audio1["abr"] > audio2["abr"]
                    end)
        end
            |> hd
            |> Map.get("url")
    end

    def parse_video(url) do
        case System.cmd("youtube-dl", ["-j", url]) do
            ({ data, _ }) ->
                info = Poison.Parser.parse!(data)

                {:ok, %{
                    "title" => info["fulltitle"],
                    "url" => url,
                    "length" => info["duration"],
                    "streamUrl" => info["formats"] |> get_best_quality(true)
                }}

            _ ->
                { :err, "Error in processing" }
        end
    end

    def parse_audio(url) do
        case System.cmd("youtube-dl", ["-j", url]) do
            ({ data, _ }) ->
                info = Poison.Parser.parse!(data)

                {:ok, %{
                    "title" => info["fulltitle"],
                    "url" => url,
                    "length" => info["duration"],
                    "streamUrl" => info["formats"] |> get_best_quality(false)
                }}
            _ ->
                { :err, "Error in processing" }
        end
    end

    # Calls
    def get_playlists(results) do
        results 
        |> Enum.reduce(%{}, fn (%{"playlist" => playlist, "song" => song}, map) ->
            title = Map.get(playlist.properties, "title")
            newSong = if song == nil, do: [], else: [song.properties]

            map = if Map.has_key?(map, title), do: map, else: Map.merge(map, %{ title => playlist.properties })

            {_, newMap } = map |> Map.get_and_update(title, fn list ->
                {_, newList} = list |> Map.get_and_update(:songs, fn songList ->
                    case songList do
                        nil ->
                            {nil, newSong}
                        l ->
                            {l, l ++ newSong}
                    end
                end)
                {list, newList}
            end)

            newMap
        end)
        |> Map.values
    end

    def get_playlist(results) do
        case results do
            [] ->
                %{}
            res ->
                songs = res |> Enum.map(fn item ->
                    case item["song"] do
                        nil ->
                            nil
                        song ->
                            song.properties
                    end
                end) |> Enum.filter(&(&1 != nil))
                {_, playlist} = (hd res)["playlist"].properties
                |> Map.get_and_update("password", &(if &1 == "", do: {&1, false}, else: {&1, true}))

                playlist 
                |> Map.put(:hasPassword, playlist["password"])
                |> Map.delete("password")
                |> Map.merge(%{ :songs => songs })
        end 
    end

    def add_playlist(title, category, password, open_submissions, type, creator) do
        playlist = Playlistr.Playlist.init(title, category, password, open_submissions, type, creator)
        GenServer.call(__MODULE__, {:add_playlist, playlist, creator})
    end

    def add_song(title, info, isVideo, url, length, streamUrl) do
        song = Playlistr.Song.init(info, isVideo, url, length, streamUrl)
        GenServer.call(__MODULE__, {:add_song, song, title})
    end

    def do_parse_audio(url) do
        GenServer.call(__MODULE__, {:parse_url, url, :audio})
    end

    def do_parse_video(url) do
        GenServer.call(__MODULE__, {:parse_url, url, :video})
    end

    def get_songs(title) do
        GenServer.call(__MODULE__, {:get_songs, title})
    end

    def get_current_playtime(title) do
        GenServer.call(__MODULE__, {:get_current_playtime, title})
    end

    def get_current_song_and_playtime(results) do
        playlist = (hd results)["playlist"].properties
                
        startDate = playlist |> Map.get("startDate", get_current_epoch_time())
        time = playlist |> Map.get("currentTime", 0)
        currentTime = time + (get_current_epoch_time() - startDate) / 1000

        songs = results 
                |> Enum.map(&(&1["songs"].properties))
                |> Enum.sort_by(&(&1["index"]))

        songs
            |> Enum.reduce_while(%{ :song => nil, :time => -1, :length => 0 }, fn song, res ->
                IO.inspect song["length"]
                {songLength, _} = if is_float(song["length"]), do: {song["length"], nil}, else: Float.parse(song["length"])

                if (res.length + songLength) > currentTime do
                    { :halt, %{ :song => song, :time => currentTime - res.length } }
                else
                    { :cont, %{ :song => nil, :time => -1, :length => res.length + song["length"] } }
                end
            end)
    end

    def get_next_song(title) do
        GenServer.call(__MODULE__, {:get_next_song, title})
    end

    def start_playlist(title) do
        GenServer.call(__MODULE__, {:start_playlist, title})
    end

    # Call handlers
    def handle_call({:get_playlists}, _from, state) do
        response = case Bolt.Sips.query(
            state.conn,
            """
                OPTIONAL MATCH (p:Playlist)-[:HAS]-(s:Song)
                RETURN p AS playlist, s AS songs
            """
        ) do
            {:ok, results} ->
                results
            {:err, _} ->
                []
        end

        {:reply, response, state}
    end

    def handle_call({:get_playlist, title}, _from, state) do
        response = case Bolt.Sips.query(
            state.conn,
            """
                OPTIONAL MATCH (p:Playlist)-[:HAS]-(s:Song)
                WHERE p.title = '#{title}'
                RETURN p AS playlist, s AS songs
            """
        ) do
            {:ok, results} ->
                results
            {:err, _} ->
                []
        end

        {:reply, response, state}
    end

    def handle_call({:add_playlist, playlist, creator}, _from, state) do
        response = case Bolt.Sips.query(
            state.conn,
            """
                MATCH (u:User) WHERE u.username = "#{creator}"
				CREATE (u)-[:CREATED { createdAt: "#{get_current_epoch_time()}" }]->(p:Playlist {
					title: "#{playlist.title}",
					category: "#{playlist.category}",
					password: "#{playlist.password}",
					openSubmissions: "#{playlist.open_submissions}",
					type: "#{playlist.type}",
					length: "#{playlist.length}",
					isPaused: "#{playlist.is_paused}",
					startDate: "#{playlist.start_date}",
					currentTime: "#{playlist.current_time}",
					hasPlayed: "#{playlist.has_played}"
				}) RETURN p AS playlist
            """
        ) do
            {:ok, _} ->
                :ok
            {:err, _} ->
                :err
        end

        {:reply, response, state}
    end

    def handle_call({:add_song, song, title}, _from, state) do
        case Bolt.Sips.query(
                state.conn, 
                "MATCH (p:Playlist)-[:HAS]-(s:Song) WHERE p.title = '#{title}' RETURN s"
            ) do
                {:ok, results} -> 
                    index = length(results)

                    case Bolt.Sips.query(
                        state.conn,
                        """
                            MATCH (p:Playlist) WHERE p.title = '#{title}'
                            CREATE UNIQUE (p)-[:HAS { addedAt: '#{get_current_epoch_time()}"}' }]->(s:Song {
                                info: '#{Map.get(song, "info")}',
                                isVideo: '#{Map.get(song, "isVideo")}',
                                url: '#{Map.get(song, "url")}',
                                length: '#{Map.get(song, "length")}',
                                streamUrl: '#{Map.get(song, "streamUrl")}',
                                index: '#{index}'
                            })
                            RETURN p as playlist, s AS song
                        """
                    ) do
                        {:ok, _ } ->
                            { :reply, :ok, state }
                        {:err, _ } ->
                            { :reply, :err, state }
                    end
                _ ->
                    { :reply, :err, state }
            end
    end

    def handle_call({:parse_url, url, format}, _from, state) do
        response = case format do
            :audio ->
                parse_audio(url)
            :video ->
                parse_video(url)
        end

        {:reply, response, state}
    end

    def handle_call({:get_songs, title}, _from, state) do
        songs = case Bolt.Sips.query(
                state.conn, 
                "MATCH (p:Playlist)-[:HAS]-(s:Song) WHERE p.title = '#{title}' RETURN s"
            ) do
                {:ok, results} -> 
                    results |> Enum.map(&(&1["s"].properties))
            
                _ -> []
            end

        { :reply, songs, state }
    end

    def handle_call({:get_current_playtime, title}, _from, state) do
        case Bolt.Sips.query(
            state.conn,
            """
                MATCH (p:Playlist) WHERE p.title = '#{title}'
                RETURN p
            """
        ) do
            {:ok, results} ->
                playlist = (hd results)["p"].properties

                time = playlist |> Map.get("currentTime", 0)
                startDate = playlist 
                    |> Map.get("startDate", get_current_epoch_time() |> Integer.to_string)
                    |> String.to_integer

                {:reply, time + (get_current_epoch_time() - startDate) / 1000, state}

            {:err, _} ->
                {:reply, :err, state}
        end
    end

    def handle_call({:start_playlist, title}, _from, state) do
        case Bolt.Sips.query(
            state.conn,
            """
                MATCH (p:Playlist) WHERE p.title = '#{title}'
                SET p.startDate = '#{get_current_epoch_time()}'
                RETURN p
            """
        ) do
            {:ok, _} ->
                {:reply, :ok, state}
                
            {:err, _} ->
                {:reply, :err, state}
        end
    end

    def handle_call({:get_current_song_and_playtime, title}, _from, state) do
        case Bolt.Sips.query(
            state.conn,
            """
                MATCH (p:Playlist)-[:HAS]-(s:Song)
                WHERE p.title = '#{title}'
                RETURN p AS playlist, s AS songs
            """
        ) do
            {:ok, results} ->
                playlist = (hd results)["playlist"].properties
                
                startDate = playlist |> Map.get("startDate", get_current_epoch_time())
                time = playlist |> Map.get("currentTime", 0)
                currentTime = time + (get_current_epoch_time() - startDate) / 1000

                songs = results |> Enum.map(&(&1["songs"].properties))

                response = songs
                    |> Enum.reduce_while(%{ :song => nil, :time => -1, :length => 0 }, fn song, res ->
                        {songLength, _} = Integer.parse(song["length"])

                        if (res.length + songLength) > currentTime do
                            { :halt, %{ :song => song, :time => currentTime - res.length } }
                        else
                            { :cont, %{ :song => nil, :time => -1, :length => res.length + song["length"] } }
                        end
                    end)

                {:reply, response, state}
            {:err, _} ->
                {:reply, :err, state}
        end
    end
end
