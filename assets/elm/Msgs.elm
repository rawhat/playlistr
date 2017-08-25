module Msgs exposing (..)

import Models exposing (LiveData, Playlist, PlaylistCategories, PlaylistHolder, Playlists)
import Navigation
import RemoteData exposing (WebData)


type Msg
    = NoOp
    | UrlChange Navigation.Location
    | FetchPlaylists (WebData Playlists)
    | StartFetchPlaylist String
    | FetchPlaylist (WebData Playlist)
    | FetchPlaylistCategories (WebData PlaylistCategories)
    | FetchPasswordPlaylist String String
    | ChangeActivePlaylist String
    | AddSongUrl
    | ChangeSongUrl String
    | RewindVideo Int
    | PauseMedia
    | AdjustVolume String
    | StartGoLive String
    | GoLive (WebData LiveData)
    | ChangePlaylistFilter String
    | ShowModal
    | HideModal
