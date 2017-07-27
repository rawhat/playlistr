module Models exposing (..)

import RemoteData exposing (WebData)


type alias LiveData =
    { songUrl : String
    , time : Float
    }


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
    , title : String
    , streamUrl : String
    , length : Int
    , isVideo : Bool
    , info : String
    , index : Int
    }


type alias Model =
    { addSongError : Bool
    , addSongUrl : String
    , currentPlaylist : WebData Playlist
    , currentPlaytime : Float
    , currentSongUrl : String
    , paused : Bool
    , playlists : WebData Playlists
    , selectedPlaylist : String
    , username : Maybe String
    , volume : Int
    }


initialModel : Model
initialModel =
    Model
        False
        ""
        RemoteData.NotAsked
        0.0
        ""
        False
        RemoteData.NotAsked
        ""
        Nothing
        25
