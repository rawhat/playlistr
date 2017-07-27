module Main exposing (..)

-- import Http

import Html exposing (..)
import RemoteData exposing (WebData)


-- import Html.Attributes exposing (..)
-- import Html.Events exposing (..)

import Commands exposing (fetchPlaylists, fetchPlaylistByTitle, goLiveOnPlaylist)
import Msgs exposing (..)
import Models exposing (Playlist)


-- import RemoteData exposing (WebData)

import Models exposing (Model, Playlists, initialModel)
import Views exposing (..)


type alias Username =
    String


type alias Password =
    String


init : ( Model, Cmd Msg )
init =
    ( initialModel, fetchPlaylists )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        FetchPlaylists response ->
            let
                updatedModel =
                    { model | playlists = response }
            in
                ( updatedModel, Cmd.none )

        FetchPasswordPlaylist username password ->
            ( model, Cmd.none )

        ChangeSongUrl url ->
            let
                updatedModel =
                    { model | addSongUrl = url }
            in
                ( updatedModel, Cmd.none )

        AddSongUrl ->
            let
                url =
                    model.addSongUrl

                updatedModel =
                    { model | addSongUrl = "" }

                _ =
                    Debug.log "url" url
            in
                ( updatedModel, Cmd.none )

        AdjustVolume vol ->
            let
                volume =
                    case (String.toInt vol) of
                        Ok num ->
                            num

                        Err _ ->
                            25

                updatedModel =
                    { model | volume = volume }
            in
                ( updatedModel, Cmd.none )

        StartFetchPlaylist title ->
            ( model, fetchPlaylistByTitle title )

        StartGoLive title ->
            ( model, goLiveOnPlaylist title )

        FetchPlaylist response ->
            let
                selectedPlaylist =
                    case response of
                        RemoteData.Success res ->
                            res.title

                        _ ->
                            ""

                updatedModel =
                    { model | currentPlaylist = response, selectedPlaylist = selectedPlaylist }
            in
                ( updatedModel, Cmd.none )

        GoLive response ->
            let
                newModel =
                    case response of
                        RemoteData.Success res ->
                            let
                                song =
                                    res.songUrl

                                time =
                                    res.time
                            in
                                { model | currentSongUrl = song, currentPlaytime = time }

                        _ ->
                            model
            in
                ( newModel, Cmd.none )

        _ ->
            ( model, Cmd.none )


main : Program Never Model Msg
main =
    Html.program
        { init = init
        , view = Views.mainView
        , update = update
        , subscriptions = (\_ -> Sub.none)
        }
