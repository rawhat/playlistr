module Commands exposing (..)

import Http
import Json.Decode as Decode
import Json.Decode.Pipeline exposing (decode, optional, required)
import RemoteData
import Models exposing (LiveData, Playlist, Playlists, PlaylistHolder, Song)
import Msgs exposing (Msg)


fetchPlaylists : Cmd Msg
fetchPlaylists =
    Http.get "http://localhost:4000/playlist" playlistsDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.FetchPlaylists


fetchPlaylistByTitle : String -> Cmd Msg
fetchPlaylistByTitle title =
    Http.get ("http://localhost:4000/playlist?playlist=" ++ title) playlistDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.FetchPlaylist


goLiveOnPlaylist : String -> Cmd Msg
goLiveOnPlaylist title =
    Http.get ("http://localhost:4000/song?playlist=" ++ title) liveDataDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.GoLive


liveDataDecoder : Decode.Decoder LiveData
liveDataDecoder =
    decode LiveData
        |> optional "songUrl" Decode.string ""
        |> required "time" Decode.float


playlistsDecoder : Decode.Decoder Playlists
playlistsDecoder =
    decode Playlists
        |> required "playlists" (Decode.list playlistDecoder)


playlistFetchDecoder : Decode.Decoder PlaylistHolder
playlistFetchDecoder =
    decode PlaylistHolder
        |> required "playlist" playlistDecoder


playlistDecoder : Decode.Decoder Playlist
playlistDecoder =
    decode Playlist
        |> required "type" Decode.string
        |> required "title" Decode.string
        |> required "password" Decode.string
        |> required "openSubmissions" Decode.bool
        |> required "length" Decode.int
        |> required "isPaused" Decode.bool
        |> required "hasPlayed" Decode.bool
        |> required "currentTime" Decode.int
        |> required "currentSongIndex" Decode.int
        |> required "category" Decode.string
        |> required "songs" (Decode.list songDecoder)


songDecoder : Decode.Decoder Song
songDecoder =
    decode Song
        |> required "url" Decode.string
        |> required "title" Decode.string
        |> required "streamUrl" Decode.string
        |> required "length" Decode.int
        |> required "isVideo" Decode.bool
        |> required "info" Decode.string
        |> required "index" Decode.int
