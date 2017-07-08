module Msgs exposing (..)

import Navigation
import Models exposing (Playlist, Playlists, PlaylistHolder)
import RemoteData exposing (WebData)


type Msg
    = UrlChange Navigation.Location
    | FetchPlaylists (WebData Playlists)
    | StartFetchPlaylist String
    | FetchPlaylist (WebData Playlist)
    | FetchPasswordPlaylist String String
    | AddSongUrl
    | ChangeSongUrl String
    | RewindVideo Int
    | PauseMedia
    | AdjustVolume String
