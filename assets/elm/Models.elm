module Models exposing (..)

import RemoteData exposing (WebData)


type alias LiveData =
    { songUrl : String
    , time : Float
    }


type alias PlaylistHolder =
    { playlist : Playlist }


type alias PlaylistCategories =
    { categories : List String }


type alias Playlist =
    { type_ : String
    , title : String
    , hasPassword : Bool
    , openSubmissions : Bool
    , length : Int
    , isPaused : Bool
    , hasPlayed : Bool
    , currentTime : Int
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


type alias PlaylistCreatorModal =
    String


type alias Model =
    { addSongError : Bool
    , addSongUrl : String
    , currentPlaylist : WebData Playlist
    , currentPlaytime : Float
    , currentSongUrl : String
    , modalShowing : Bool
    , paused : Bool
    , playlistCategoryFilter : String
    , playlistCategories : WebData PlaylistCategories
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
        False
        "All"
        RemoteData.NotAsked
        RemoteData.NotAsked
        ""
        Nothing
        25
