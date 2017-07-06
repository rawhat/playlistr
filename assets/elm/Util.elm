module Util exposing (..)


type alias Playlist =
    { title : String
    , type_ : String
    , category : String
    , hasPassword : Bool
    , length_ : Int
    , openSubmissions : Bool
    , isPaused : Bool
    }
