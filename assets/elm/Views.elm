module Views exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import Css exposing (asPairs, backgroundColor, marginTop, marginLeft, marginRight, paddingBottom, paddingRight, px)
import Models exposing (Model, Playlists, Playlist)
import RemoteData exposing (WebData)
import Msgs exposing (Msg)


styles : List Css.Style -> Attribute msg
styles =
    Css.asPairs >> Html.Attributes.style


mainView : Model -> Html Msg
mainView model =
    div []
        [ navBar model
        , div [ id "top-section" ]
            [ div [ styles [ marginTop (px 60) ] ]
                [ div [ class "row middle-section" ]
                    [ div [ class "col-md-2 col-sm-12" ]
                        [ div [ class "row" ]
                            [ addSongArea model ]
                        , div [ class "row" ]
                            [ playlistSidebar model ]
                        ]
                    , div [ class "col-md-10 col-sm-12" ]
                        [ div [ class "row" ]
                            [ mediaBar model ]
                        , div [ class "row" ]
                            [ div [ id "playlist_area", styles [ marginRight (px 50) ] ]
                                [ div
                                    [ class "row"
                                    , styles
                                        [ marginLeft (px 50)
                                        , marginRight (px 50)
                                        , paddingBottom (px 10)
                                        ]
                                    ]
                                    [ div [ class "pull-left" ] [ goLiveLink ]
                                    , div [ class "pull-right" ] [ exportPlaylistLink ]
                                    ]
                                , contentSection model
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]


navBar : Model -> Html msg
navBar model =
    let
        userSection =
            case model.username of
                Just username ->
                    text username

                Nothing ->
                    text ""
    in
        nav [ class "navbar navbar-default navbar-fixed-top " ]
            [ div [ class "container-fluid" ]
                [ div [ class "navbar-header" ]
                    [ div [ class "navbar-brand" ]
                        [ a [ href "/" ] [ text "Playlistr" ]
                        , userSection
                        ]
                    ]
                ]
            ]


playlistList : WebData Playlists -> String -> Html Msg
playlistList response selectedPlaylist =
    case response of
        RemoteData.NotAsked ->
            text ""

        RemoteData.Loading ->
            text "Loading..."

        RemoteData.Success playlists ->
            let
                content =
                    if (List.length playlists.playlists) == 0 then
                        [ div [ class "panel panel-default" ]
                            [ div [ class "panel-body" ]
                                [ text "There's nothing here yet" ]
                            ]
                        ]
                    else
                        (List.map
                            (\playlist ->
                                playlistEntry playlist (playlist.title == selectedPlaylist)
                            )
                            playlists.playlists
                        )
            in
                ul [ class "list-group" ] content

        RemoteData.Failure error ->
            text (toString error)


playlistSidebar : Model -> Html Msg
playlistSidebar model =
    div []
        [ playlistCreator model
        , playlistList model.playlists model.selectedPlaylist
        ]


playlistCreator : Model -> Html Msg
playlistCreator model =
    text "playlistCreator"


playlistEntry : Playlist -> Bool -> Html Msg
playlistEntry playlist selected =
    let
        buttonStyle =
            if selected then
                [ styles [ (backgroundColor (Css.hex "375a7f")) ] ]
            else
                []

        passwordIcon =
            if playlist.password /= "" then
                span [ class "glyphicon glyphicon-lock", styles [ paddingRight (px 5) ] ] []
            else
                text ""
    in
        button
            (buttonStyle
                ++ [ type_ "button"
                   , class "list-group-item playlist-selector"
                   , id playlist.title
                   , onClick (Msgs.StartFetchPlaylist playlist.title)
                   ]
            )
            [ text playlist.title
            , div [ class "pull-right" ] [ passwordIcon ]
            ]


addSongArea : Model -> Html Msg
addSongArea model =
    div [ class "form-group" ]
        [ div [ class "input-group" ]
            [ input
                [ class "form-control"
                , type_ "text"
                , placeholder "Add song to current playlist"
                , onInput Msgs.ChangeSongUrl
                , value (model.addSongUrl)
                ]
                []
            , div [ class "input-group-btn" ]
                [ button [ class "btn btn-default", (onClick Msgs.AddSongUrl) ] [ text "+" ] ]
            ]
        ]


mediaBar : Model -> Html Msg
mediaBar model =
    case model.currentPlaylist of
        RemoteData.Success playlist ->
            if playlist.type_ == "music" then
                customAudioBar model
            else
                text ""

        _ ->
            text ""


customAudioBar : Model -> Html msg
customAudioBar model =
    text "audioBar"


goLiveLink : Html msg
goLiveLink =
    text "goLiveLink"


exportPlaylistLink : Html msg
exportPlaylistLink =
    text "exportPlaylistLink"


contentSection : Model -> Html Msg
contentSection model =
    case model.currentPlaylist of
        RemoteData.Success playlist ->
            if playlist.type_ == "music" then
                songArea model
            else
                div [ class "video-area" ]
                    [ videoPlayer model
                    , songArea model
                    ]

        _ ->
            text ""


songArea : Model -> Html Msg
songArea model =
    text "songArea"


playlistSong : String -> Int -> Bool -> Html Msg
playlistSong info length selected =
    let
        playingIcon =
            if selected then
                span [ class "glyphicon glyphicon-headphones pull-right" ] []
            else
                text ""

        mins =
            floor ((toFloat length) / 60)

        seconds =
            length - (mins * 60)

        secs =
            if seconds < 10 then
                "0" ++ (toString seconds)
            else
                toString seconds

        time =
            (toString mins) ++ secs

        -- add in local state?
        hiddenContent =
            ul [ class "list-group" ]
                [ li [ class "list-group-item" ]
                    [ span [ class "pull-right" ] [ text time ]
                    , div [ class "clearfix" ] []
                    ]
                ]
    in
        div [ class "panel panel-default" ]
            [ div [ class "panel-heading" ]
                [ h4 [ class "panel-title pull-left" ] [ text info ]
                , playingIcon
                , hiddenContent
                ]
            ]


videoPlayer : Model -> Html Msg
videoPlayer model =
    let
        videoSource =
            case model.currentSong of
                Just source ->
                    [ src source.streamUrl ]

                Nothing ->
                    []

        videoHidden =
            case model.currentSong of
                Just _ ->
                    [ hidden False ]

                Nothing ->
                    [ hidden True ]

        videoTag =
            video ([ controls False, style [ ( "width", "85%" ) ] ] ++ videoSource ++ videoHidden) []
    in
        div []
            [ div [ class "row" ]
                [ videoTag ]
            , div [ class "row", style [ ( "margin", "20px auto" ) ] ]
                [ div [ class "col-md-3" ]
                    [ div [ class "btn-group" ]
                        [ button [ class "btn btn-primary", onClick (Msgs.RewindVideo 30) ] [ text "<<" ]
                        , button [ class "btn btn-primary", onClick (Msgs.RewindVideo 15) ] [ text "<" ]
                        , button [ class "btn btn-primary", onClick (Msgs.PauseMedia) ]
                            [ span
                                [ class
                                    (if model.paused then
                                        "play"
                                     else
                                        "pause"
                                    )
                                ]
                                []
                            ]
                        ]
                    ]
                , div [ class "col-md-7" ]
                    [ progressBar model ]
                , div [ class "col-md-2" ]
                    [ volumeControl model ]
                ]
            ]


progressBar : Model -> Html Msg
progressBar model =
    text "progressBar"


volumeControl : Model -> Html Msg
volumeControl model =
    input
        [ type_ "range"
        , style [ ( "position", "relative" ), ( "top", "12px" ) ]
        , Html.Attributes.min "0"
        , Html.Attributes.max "100"
        , defaultValue "25"
        , onInput Msgs.AdjustVolume
        ]
        []
