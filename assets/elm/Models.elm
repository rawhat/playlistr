module Models exposing (..)

import RemoteData exposing (WebData)


type alias PlaylistHolder =
    { playlist : Playlist }


type alias Playlist =
    { title : String
    , password : String
    , type_ : String
    }


type alias Playlists =
    { playlists : List Playlist }


type alias Song =
    { url : String
    , streamUrl : String
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
