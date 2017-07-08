module Commands exposing (..)

import Http
import Json.Decode as Decode
import Json.Decode.Pipeline exposing (decode, required)
import RemoteData
import Models exposing (Playlist, Playlists, PlaylistHolder)
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
        |> required "title" Decode.string
        |> required "password" Decode.string
        |> required "type" Decode.string
