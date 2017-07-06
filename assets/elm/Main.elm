module Main exposing (..)

import Http
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation


type alias Username =
    String


type alias Password =
    String


type Msg
    = UrlChange Navigation.Location
    | FetchPlaylists
    | FetchPlaylist String
    | FetchPasswordPlaylist Username Password


type alias Model =
    { history : List Navigation.Location }


init location =
    ( Model [ location ], Cmd.none )


view model =
    div []
        [ text "Hello, world!"
        , button [] [ text "Click me!" ]
        ]


update msg model =
    case msg of
        FetchPlaylists ->
            ( model, Cmd.none )

        FetchPlaylist title ->
            ( model, Cmd.none )

        FetchPasswordPlaylist username password ->
            ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


main =
    Navigation.program UrlChange
        { init = init
        , view = view
        , update = update
        , subscriptions = (\_ -> Sub.none)
        }
