module Commands exposing (..)

import Http
import Json.Decode as Decode
import Json.Decode.Pipeline exposing (decode, optional, required)
import Models exposing (LiveData, Playlist, PlaylistCategories, PlaylistHolder, Playlists, Song)
import Msgs exposing (Msg)
import RemoteData


urlBase : String
urlBase =
    "http://192.168.125.104:4000/"


fetchPlaylists : Cmd Msg
fetchPlaylists =
    Http.get (urlBase ++ "playlist") playlistsDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.FetchPlaylists


fetchPlaylistByTitle : String -> Cmd Msg
fetchPlaylistByTitle title =
    Http.get (urlBase ++ "playlist?playlist=" ++ title) playlistDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.FetchPlaylist


fetchPlaylistCategories : Cmd Msg
fetchPlaylistCategories =
    Http.get (urlBase ++ "playlist/category") playlistCategoryDecoder
        |> RemoteData.sendRequest
        |> Cmd.map Msgs.FetchPlaylistCategories


goLiveOnPlaylist : String -> Cmd Msg
goLiveOnPlaylist title =
    Http.get (urlBase ++ "song?playlist=" ++ title) liveDataDecoder
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
        |> required "hasPassword" Decode.bool
        |> required "openSubmissions" Decode.bool
        |> required "length" Decode.int
        |> required "isPaused" Decode.bool
        |> required "hasPlayed" Decode.bool
        |> required "currentTime" Decode.int
        |> required "category" Decode.string
        |> required "songs" (Decode.list songDecoder)


playlistCategoryDecoder : Decode.Decoder PlaylistCategories
playlistCategoryDecoder =
    decode PlaylistCategories
        |> required "categories" (Decode.list Decode.string)


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
