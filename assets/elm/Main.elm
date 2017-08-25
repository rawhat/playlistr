module Main exposing (..)

-- import Http
-- import Html.Attributes exposing (..)
-- import Html.Events exposing (..)
-- import RemoteData exposing (WebData)

import Commands exposing (fetchPlaylistByTitle, fetchPlaylistCategories, fetchPlaylists, goLiveOnPlaylist)
import Html exposing (..)
import Models exposing (Model, Playlist, Playlists, initialModel)
import Msgs exposing (..)
import RemoteData exposing (WebData)
import Views exposing (..)


type alias Username =
    String


type alias Password =
    String


init : ( Model, Cmd Msg )
init =
    initialModel ! [ fetchPlaylists, fetchPlaylistCategories ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        FetchPlaylists response ->
            ( { model | playlists = response }, Cmd.none )

        FetchPasswordPlaylist username password ->
            ( model, Cmd.none )

        FetchPlaylistCategories res ->
            ( { model | playlistCategories = res }, Cmd.none )

        ChangeSongUrl url ->
            ( { model | addSongUrl = url }, Cmd.none )

        ShowModal ->
            ( { model | modalShowing = True }, Cmd.none )

        HideModal ->
            ( { model | modalShowing = False }, Cmd.none )

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
                    case String.toInt vol of
                        Ok num ->
                            num

                        Err _ ->
                            25

                updatedModel =
                    { model | volume = volume }
            in
            ( updatedModel, Cmd.none )

        ChangePlaylistFilter filter ->
            ( { model | playlistCategoryFilter = filter }, Cmd.none )

        StartFetchPlaylist title ->
            ( model, fetchPlaylistByTitle title )

        StartGoLive title ->
            ( model, goLiveOnPlaylist title )

        FetchPlaylist response ->
            ( { model | currentPlaylist = response }, Cmd.none )

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
        , subscriptions = \_ -> Sub.none
        }
