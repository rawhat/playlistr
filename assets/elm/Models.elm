module Models exposing (..)

import RemoteData exposing (WebData)


type alias PlaylistHolder =
    { playlist : Playlist }


type alias Playlist =
    { type_ : String
    , title : String
    , password : String
    , openSubmissions : Bool
    , length : Int
    , isPaused : Bool
    , hasPlayed : Bool
    , currentTime : Int
    , currentSongIndex : Int
    , category : String
    , songs : List Song
    }


type alias Playlists =
    { playlists : List Playlist }


type alias Song =
    { url : String
    , streamUrl : String
    , length : Int
    , isVideo : Bool
    , info : String
    , index : Int
    }


type alias Model =
    { playlists : WebData Playlists
    , username : Maybe String
    , selectedPlaylist : String
    , addSongUrl : String
    , addSongError : Bool
    , currentPlaylist : WebData Playlist
    , currentSong : Maybe Song
    , paused : Bool
    , volume : Int
    }


initialModel : Model
initialModel =
    Model
        RemoteData.Loading
        Nothing
        ""
        ""
        False
        RemoteData.NotAsked
        Nothing
        False
        25
