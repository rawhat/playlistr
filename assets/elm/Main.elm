module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation


type Msg
    = UrlChange Navigation.Location


type alias Model =
    { history : List Navigation.Location }


init location =
    ( Model [ location ], Cmd.none )


view model =
    div [] [ text "Hello, world!" ]


update msg model =
    ( model, Cmd.none )


main =
    Navigation.program UrlChange
        { init = init
        , view = view
        , update = update
        , subscriptions = (\_ -> Sub.none)
        }
